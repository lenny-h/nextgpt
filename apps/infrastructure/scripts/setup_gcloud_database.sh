#!/bin/bash
set -e

# Initial database setup script using Cloud SQL Proxy
# This script runs only during Terraform apply for initial setup

# Configuration
DB_CONNECTION_NAME="$1"
DB_NAME="$2"
POSTGRES_PASSWORD="$3"
SUPABASE_ADMIN_PASSWORD="$4"
JWT_SECRET="$5"
JWT_EXP="$6"
SCRIPTS_DIR="$(dirname "$0")"
SQL_FILES_DIR="../supabase/volumes/db"
PROXY_PORT="5432"

if [ -z "$DB_CONNECTION_NAME" ] || [ -z "$DB_NAME" ] || [ -z "$POSTGRES_PASSWORD" ] || [ -z "$SUPABASE_ADMIN_PASSWORD" ] || [ -z "$JWT_SECRET" ] || [ -z "$JWT_EXP" ]; then
    echo "Usage: $0 <db_connection_name> <db_name> <postgres_password> <supabase_admin_password> <jwt_secret> <jwt_exp>"
    exit 1
fi

export POSTGRES_USER="postgres"
export SUPABASE_ADMIN_USER="supabase_admin"
export PGPASSWORD="$POSTGRES_PASSWORD"
export SUPABASE_ADMIN_PASSWORD="$SUPABASE_ADMIN_PASSWORD"
export SUPABASE_AUTH_ADMIN_PASSWORD="$SUPABASE_ADMIN_PASSWORD"
export JWT_SECRET="$JWT_SECRET"
export JWT_EXP="$JWT_EXP"

echo "Setting up initial database configuration..."

# Start Cloud SQL Proxy in background (using public IP)
echo "Starting Cloud SQL Proxy for $DB_CONNECTION_NAME..."
cloud_sql_proxy "$DB_CONNECTION_NAME" --port="$PROXY_PORT" &
PROXY_PID=$!

# Function to cleanup proxy on exit
cleanup() {
    if [ -n "$PROXY_PID" ]; then
        echo "Stopping Cloud SQL Proxy..."
        kill $PROXY_PID 2>/dev/null || true
        wait $PROXY_PID 2>/dev/null || true
    fi
}

# Waiting for cloud proxy to get ready
sleep 15

# Test connection
for i in {1..10}; do
    if psql -h 127.0.0.1 -p "$PROXY_PORT" -U "$POSTGRES_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
        echo "✓ Connection established"
        break
    fi
    echo "Attempt $i: Unable to connect to DB, retrying..."
    if [ $i -eq 10 ]; then
        echo "❌ Failed to connect to database after 10 attempts"
        cleanup
        exit 1
    fi
    sleep 3
done

# Check if supabase_core migration has already been applied
if psql -h 127.0.0.1 -p "$PROXY_PORT" -U "$POSTGRES_USER" -d "$DB_NAME" -t -c "SELECT 1 FROM migrations WHERE name = 'supabase_core';" 2>/dev/null | grep -q 1; then
    echo "✓ Supabase core setup already completed. Skipping initial setup."
    cleanup
    exit 0
fi

# Create migrations table for tracking
echo "=== Setting up migration tracking ==="
psql -h 127.0.0.1 -p "$PROXY_PORT" -U "$POSTGRES_USER" -d "$DB_NAME" -c "
    CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        checksum VARCHAR(64)
    );
" || echo "Migration table creation failed or already exists"

# Function to execute SQL file safely for initial setup
execute_sql_file() {
    local file="$1"
    local description="$2"
    local user="${3:-$POSTGRES_USER}"
    local password="$POSTGRES_PASSWORD"
    if [ "$user" = "$SUPABASE_ADMIN_USER" ]; then
        password="$SUPABASE_ADMIN_PASSWORD"
    fi

    echo "Executing: $description as $user"
    if [ -f "$file" ]; then
        # Test connection before executing
        if ! PGPASSWORD="$password" psql -h 127.0.0.1 -p "$PROXY_PORT" -U "$user" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
            echo "❌ Error: Lost connection to database before executing $description"
            return 1
        fi
        PGPASSWORD="$password" psql -h 127.0.0.1 -p "$PROXY_PORT" -U "$user" -d "$DB_NAME" -f "$file" || echo "⚠ Warning: Some statements in $description failed (this may be expected for initial setup)"
        echo "✓ Completed: $description"
    else
        echo "⚠ Warning: File not found: $file"
    fi
}

echo "=== Running initial Supabase setup ==="

# Run init files in order
echo "=== Running init files in order ==="
if [ -d "$SQL_FILES_DIR/cloud-sql/init" ]; then
    for file in "$SQL_FILES_DIR/cloud-sql/init/"[0-9][0-9][0-9]_*.sql; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            # If filename matches *_supabase_admin.sql, use supabase_admin user
            if [[ "$filename" == *_supabase_admin.sql ]]; then
                execute_sql_file "$file" "Init: $filename" "$SUPABASE_ADMIN_USER"
            else
                execute_sql_file "$file" "Init: $filename"
            fi
        fi
    done
else
    echo "⚠ Warning: Init directory not found: $SQL_FILES_DIR/cloud-sql/init"
fi

# Run Supabase setup files
execute_sql_file "$SQL_FILES_DIR/cloud-sql/_supabase.sql" "Creating _supabase internal database"
execute_sql_file "$SQL_FILES_DIR/cloud-sql/roles.sql" "Setting up database roles and passwords"

# Mark Supabase core as installed
if ! psql -h 127.0.0.1 -p "$PROXY_PORT" -U "$POSTGRES_USER" -d "$DB_NAME" -c "
    INSERT INTO migrations (name, applied_at, checksum) 
    VALUES ('supabase_core', NOW(), 'initial_setup') 
    ON CONFLICT (name) DO NOTHING;
" 2>/dev/null; then
    echo "Failed to record supabase_core migration"
fi

# All database operations completed - now safe to cleanup proxy
cleanup

# Disable public IP on Cloud SQL instance
echo "Disabling public IP on Cloud SQL instance..."
gcloud sql instances patch "${DB_NAME}" --no-assign-ip
echo "✓ Public IP disabled on Cloud SQL instance"

echo "=== Initial database setup completed ==="
echo "Future migrations should be handled by GitHub Actions"
echo "Database is ready for use!"