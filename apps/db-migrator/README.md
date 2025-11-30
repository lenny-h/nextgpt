# DB Migrator

Database migration service for NextGPT using Drizzle Kit.

## Overview

This service runs database migrations to set up and update the PostgreSQL database schema. It's designed to run as a one-time job during deployment or when schema changes are needed.

## Environment Variables

### Required Variables

- `DATABASE_HOST` - PostgreSQL database host endpoint
- `DATABASE_PASSWORD` - PostgreSQL database password (should be stored securely)
- `NODE_ENV` - Node environment (typically "production")

### Optional Variables

- `USE_FIRECRAWL` - Whether to include Firecrawl-related migrations (default: `false`)
  - Set to `true` to enable Firecrawl features
  - Set to `false` to skip Firecrawl migrations

- `EMBEDDING_DIMENSIONS` - Vector embedding dimensions for the chunks table (default: `768`)
  - This must match the dimensions of the embedding model you're using
  - **Important**: Aws only support embedding dimensions of 256, 512, and 1024. The value should not be changed after initial migration.

## How It Works

The migration script (`migrate.sh`) performs the following steps:

1. **Configure Embedding Dimensions**: If `EMBEDDING_DIMENSIONS` is set, it updates the migration SQL files to use the specified dimension instead of the default 768.

2. **Handle Firecrawl Migrations**: Based on the `USE_FIRECRAWL` flag:
   - If `true`: Runs all migrations including Firecrawl-specific tables
   - If `false`: Creates an empty placeholder for Firecrawl migrations

3. **Run Migrations**: Executes `drizzle-kit migrate` to apply all pending migrations to the database.

## Usage

### Local Development

```bash
# Set environment variables
export DATABASE_HOST="localhost:5432"
export DATABASE_PASSWORD="your-password"
export NODE_ENV="development"
export USE_FIRECRAWL="false"
export EMBEDDING_DIMENSIONS="768"

# Run migrations
./migrate.sh
```

### Docker

```bash
docker build -t db-migrator .
docker run \
  -e DATABASE_HOST="your-db-host" \
  -e DATABASE_PASSWORD="your-password" \
  -e NODE_ENV="production" \
  -e USE_FIRECRAWL="false" \
  -e EMBEDDING_DIMENSIONS="768" \
  db-migrator
```

## Migration Files

Migration files are located in `packages/server/src/drizzle/`:

- `0000_sloppy_micromacro.sql` - Firecrawl-specific migrations
- `0001_tearful_firedrake.sql` - Core schema including vector embeddings
