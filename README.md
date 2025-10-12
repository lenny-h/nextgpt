# Local Docker Setup

The Docker Compose in this directory allows you to run all services locally for testing purposes.

## Services Included

- **PostgreSQL Database**: PostgreSQL with pgvector extension
- **Redis**: Redis instance with AOF persistence
- **API**: Custom API service (optional)
- **Document Processor**: Document processing service (optional)
- **PDF Exporter**: PDF export service (optional)
- **Web**: Main application service (optional)
- **Dashboard**: Dashboard service (optional)

API, Document Processor, PDF Exporter, Web, and Dashboard services can also be started using pnpm run dev, which provides hot-reloading for development and is thus recommended.

## Prerequisites

- Docker and Docker Compose installed
- All the custom services (api, document-processor, pdf-exporter, web, dashboard) built successfully
- Access to the drizzle migrations in `packages/server/src/drizzle`

## Port Mapping

The services are exposed on the following local ports:

| Service            | Local Port | Container Port |
| ------------------ | ---------- | -------------- |
| PostgreSQL         | 5432       | 5432           |
| Redis              | 6379       | 6379           |
| App                | 3000       | 8080           |
| Dashboard          | 3001       | 8080           |
| API                | 3004       | 8080           |
| PDF Exporter       | 3005       | 8080           |
| Document Processor | 3006       | 8080           |

## Environment Configuration

The `.env` file in the root directory contains all the necessary environment variables. Make sure to:

1. Update the secrets (passwords, keys) before running in any shared environment
2. Configure SMTP settings if you need email functionality

## Usage

### PostgreSQL with pgvector

- **Image**: `pgvector/pgvector:pg17`
- **Port**: `5432`
- **Extensions**: uuid-ossp, pg_trgm, pgvector
- **Schema**: Automatically initialized from Drizzle migrations on first startup

### Redis

- **Image**: `redis:7.2.11-alpine`
- **Port**: `6379`
- **Persistence**: Enabled with AOF (Append Only File)

## Quick Start

1. **Copy the environment file**:

   ```bash
   cp .env.example .env
   ```

2. **Update the `.env` file** with your configuration. At minimum, set:
   - `DB_PASSWORD`: PostgreSQL password (default: `postgres`)
   - `POSTGRES_DB`: Database name (default: `postgres`)
   - `DATABASE_URL`: Full connection string

3. **Start the services**:

   ```bash
   docker-compose up -d
   ```

4. **Check service health**:

   ```bash
   docker-compose ps
   ```

5. **View logs**:
   ```bash
   docker-compose logs -f postgres
   docker-compose logs -f redis
   ```

## Database Initialization

On first startup, the PostgreSQL container will automatically:

1. Enable required extensions (uuid-ossp, pg_trgm, pgvector)
2. Run the Drizzle schema migrations from `packages/server/src/drizzle`
3. Create all tables, indexes, and constraints

The database is ready to use once the health check passes.

## Drizzle Migrations

The project uses Drizzle ORM for database management.

### Generate a new migration:

```bash
cd packages/server
pnpm drizzle-kit generate
```

### Apply migrations:

If you create new migrations after the initial setup, you can apply them using:

```bash
cd packages/server
pnpm drizzle-kit push
# or
pnpm drizzle-kit migrate
```

### View the database in Drizzle Studio:

```bash
cd packages/server
pnpm drizzle-kit studio
```

## Managing Services

### Stop services:

```bash
docker-compose down
```

### Stop and remove volumes (⚠️ deletes all data):

```bash
docker-compose down -v
```

### Restart a specific service:

```bash
docker-compose restart postgres
```

### Access PostgreSQL shell:

```bash
docker exec -it postgres psql -U postgres -d postgres
```

### Access Redis CLI:

```bash
docker exec -it redis redis-cli
```

## Troubleshooting

### Database connection refused

- Ensure the container is running: `docker-compose ps`
- Check logs: `docker-compose logs postgres`
- Verify the port is not in use: `lsof -i :5432`

### Schema not initialized

- Check if the migration file exists: `packages/server/src/drizzle/0000_broken_makkari.sql`
- View initialization logs: `docker-compose logs postgres`
- Manually apply schema: `docker exec -i postgres psql -U postgres < packages/server/src/drizzle/0000_broken_makkari.sql`

### Reset the database

To start fresh with a clean database:

```bash
docker-compose down -v
docker-compose up -d
```

## Connection Details

### PostgreSQL

- **Host**: `localhost`
- **Port**: `5432`
- **User**: `postgres`
- **Password**: Value from `DB_PASSWORD` in `.env`
- **Database**: Value from `POSTGRES_DB` in `.env`
- **Connection String**: `postgresql://postgres:${DB_PASSWORD}@localhost:5432/${POSTGRES_DB}`

### Redis

- **Host**: `localhost`
- **Port**: `6379`
- **Connection String**: `redis://localhost:6379`

## Performance Tuning

The PostgreSQL service is configured with:

- `max_connections=200`: Maximum concurrent connections
- `shared_buffers=256MB`: Memory for caching data
- `shared_preload_libraries=vector`: Preload pgvector extension

You can adjust these in the `docker-compose.yml` file under the `postgres` service command section.

## Troubleshooting

### Common Issues

1. **Port conflicts**: Make sure the ports aren't already in use
2. **Build failures**: Ensure the custom services (api, dashboard, document-processor, pdf-exporter) can be built
3. **Database connection issues**: Check that PostgreSQL is healthy before other services start
4. **Volume mount issues**: Ensure the ../volumes directory exists and is accessible

## Notes

- This setup is intended for development and testing only
- Make sure to update all default passwords and secrets before any shared usage

# Hosted on Google Cloud

The setup can be hosted on Google Cloud by following the following steps (in the given order):

1. **Create a new project on Google Cloud** and note the project id. Enable the Artifact Registry API and create an artifact repository named `app-artifact-repository` in your desired region (e.g. europe-west1).
2. **Build and push docker images** Run the provided shell script from the root directory to build and push all necessary Docker images:

   ```bash
   bash apps/infrastructure/scripts/build_and_push_images.sh <project_id> <region>
   ```

   Replace `<project_id>` with your Google Cloud project ID and `<region>` with your desired Google Cloud region (e.g., `europe-west1`).

3. **Create a cloudflare account** and add your domain in the overview page.
4. **Install gcloud, terraform and psql** If you are on MacOS, you can use the following commands:

   ```bash
   brew install gcloud
   brew install terraform
   ```

   If you are on Windows, you can use the following commands (requires winget):

   ```bash
   winget install Google.Cloud.SDK
   winget install HashiCorp.Terraform
   ```

   If you are on Linux, you know what to do 😉.

5. **Set env variables** Copy the apps/infrastructure/terraform.tfvars.example file and rename the copy to apps/infrastructure/terraform.tfvars. Edit the file and set the variables to your desired values.
6. **Deploy infrastructure** Make sure terraform is installed, then run `terraform init` and `terraform apply` in apps/supabase/infrastructure. This will deploy the infrastructure and may take a while to complete. The deployed infrastructure can incur costs. You can always destroy it again using `terraform destroy`. However, this will delete all data in the database.
7. **Add DNS record** Add the two A records mentioned in the output of the terraform apply command to your Cloudflare DNS settings.
8. **Create a new GitHub repository** and add the following secret:
   - `CLOUDFLARE_API_TOKEN` - A Cloudflare API token with permissions to edit cloudflare workers and cloudflare R2 storage.
   - `GCP_SA_KEY` - The private key of the CI/CD service account, which you can find in the output of the terraform apply command.

   Furthermore, add the following environment variables:
   - `WEB_URL` - The domain name for your site (e.g. yourdomain.com)
   - `PROJECT_ID` - The Google Cloud project id you obtained in step 1.
   - `REGION` - The Google Cloud region you want to use (e.g. europe-west1)
   - `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID (found in the overview page of your Cloudflare dashboard; it is also visible in the URL when you are on the overview page)
   - `R2_ENDPOINT` - The Cloudflare R2 endpoint, given by https://<account_id>.r2.cloudflarestorage.com or https://<account_id>.r2.eu.cloudflarestorage.com if you want to use an EU specific endpoint.

9. **Adapt wrangler.toml files** Change the domain in apps/web/wrangler.toml and apps/dashboard/wrangler.toml to your domain.
10. **Push to GitHub** Push your code to GitHub, which will trigger the GitHub Actions workflows. The GitHub actions will run database migrations, deploy the web and dashboard apps to Cloudflare Workers, and the API, document-processor and pdf-exporter to Google Cloud Run.
