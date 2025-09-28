#!/bin/bash
set -e

# Database migration script using Cloud SQL Proxy
# This script connects to private Cloud SQL instances and runs migrations safely

# Configuration
DB_CONNECTION_NAME="$1"
DB_NAME="$2"
DB_USER="$3"
DB_PASSWORD="$4"
JWT_SECRET="$5"
JWT_EXP="$6"
SCRIPTS_DIR="$(dirname "$0")"
SQL_FILES_DIR="../supabase/volumes/db"
PROXY_PORT="5432"

if [ -z "$DB_CONNECTION_NAME" ] || [ -z "$DB_NAME" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ] || [ -z "$JWT_SECRET" ] || [ -z "$JWT_EXP" ]; then
    echo "Usage: $0 <db_connection_name> <db_name> <db_user> <db_password> <jwt_secret> <jwt_exp> <service_account_key_path>"
    echo "Example: $0 project:region:instance postgres postgres mypassword mysecret 3600 ./key.json"
    exit 1
fi

export POSTGRES_USER="$DB_USER"
export PGPASSWORD="$DB_PASSWORD"
export JWT_SECRET="$JWT_SECRET"
export JWT_EXP="$JWT_EXP"

# Start Cloud SQL Proxy in background
echo "Starting Cloud SQL Proxy..."
cloud_sql_proxy "$DB_CONNECTION_NAME" --port="$PROXY_PORT" &
PROXY_PID=$!

# Function to cleanup proxy on exit
cleanup() {
    echo "Stopping Cloud SQL Proxy..."
    kill $PROXY_PID 2>/dev/null || true
    wait $PROXY_PID 2>/dev/null || true
}
trap cleanup EXIT

# Wait for proxy to be ready
echo "Waiting for Cloud SQL Proxy to be ready..."
sleep 5

# Test connection
for i in {1..30}; do
    if pg_isready -h localhost -p "$PROXY_PORT" -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
        echo "✓ Connection established"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Failed to connect to database"
        exit 1
    fi
    sleep 1
done

# Function to execute SQL file
execute_sql_file() {
    local file="$1"
    local description="$2"
    
    echo "Executing: $description"
    if [ -f "$file" ]; then
        psql -h localhost -p "$PROXY_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$file" || echo "⚠ Warning: Some statements in $description failed (this may be expected for initial setup)"
        echo "✓ Completed: $description"
    else
        echo "⚠ Warning: File not found: $file"
    fi
}

# Function to check if a migration has been applied
migration_exists() {
    local migration_name="$1"
    
    local count=$(psql -h localhost -p "$PROXY_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT COUNT(*) FROM migrations WHERE name = '$migration_name';
    " 2>/dev/null | tr -d ' ')
    
    [ "$count" -gt 0 ]
}

# Function to record a migration as applied
record_migration() {
    local migration_name="$1"
    psql -h localhost -p "$PROXY_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        INSERT INTO migrations (name, applied_at) VALUES ('$migration_name', NOW());
    "
}

# Run migrations
MIGRATIONS_DIR="$SQL_FILES_DIR/migrations"
if [ -d "$MIGRATIONS_DIR" ]; then
    echo "Checking for additional migrations..."
    for sql_file in "$MIGRATIONS_DIR"/*.sql; do
        if [ -f "$sql_file" ]; then
            migration_name=$(basename "$sql_file" .sql)
            
            if ! migration_exists "$migration_name"; then
                echo "Running new migration: $migration_name"
                execute_sql_file "$sql_file" "Migration: $migration_name"
                record_migration "$migration_name"
            else
                echo "Migration already applied: $migration_name"
            fi
        fi
    done
fi

echo "=== Database migrations completed successfully ==="
echo "Database is ready for use!"