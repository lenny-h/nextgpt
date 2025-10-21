# Database Migrator

This is a Cloud Run job that runs database migrations using Drizzle Kit. It's designed to work with private Cloud SQL instances that don't have public IP addresses.

## How It Works

1. **Dockerfile**: Builds a container image with:
   - Node.js 22
   - pnpm package manager
   - The `@workspace/server` package (which contains the Drizzle schema and migrations)
   - An entrypoint script that runs `pnpm drizzle-kit migrate`

2. **Cloud Run Job**: Deployed as a job (not a service) that:
   - Connects to the Cloud SQL instance via VPC (private IP)
   - Runs the migrations
   - Exits when complete

3. **GitHub Actions**: The workflow automatically:
   - Builds the Docker image when changes are detected in:
     - `packages/server/src/drizzle/**` (schema or migration files)
   - Pushes the image to Google Artifact Registry
   - Updates the Cloud Run job
   - Executes the job to run migrations
   - Shows logs for debugging

## Local Testing

To test the migration image locally (requires Docker and access to the database):

```bash
# Build the image
docker build -f apps/db-migrator/Dockerfile -t db-migrator:test .

# Run the migration (requires DATABASE_URL)
docker run --rm \
  -e DATABASE_URL="postgresql://user:pass@host:5432/dbname" \
  db-migrator:test
```

## Manual Execution

To manually trigger migrations in production:

```bash
# Using the GitHub Actions UI (workflow_dispatch)
# Or via gcloud CLI:
gcloud run jobs execute db-migrator \
  --region=us-central1 \
  --project=YOUR_PROJECT_ID \
  --wait
```

## Terraform Configuration

The infrastructure is defined in `apps/infrastructure/db_migrator.tf`:

- Creates the Cloud Run job
- Configures VPC access for private database connection
- Sets up IAM permissions for CI/CD service account

## Environment Variables

- `NODE_ENV`: Set to "production" in the Cloud Run job
- `DATABASE_URL`: PostgreSQL connection string (set automatically by Terraform)
