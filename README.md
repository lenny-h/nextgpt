# NextGPT

NextGPT is a platform designed to deploy a secure AI interface with integrated document and web search capabilities on one of the major cloud providers (Amazon Web Services, Google Cloud, and Microsoft Azure (not supported yet)). Its primary mission is to give enterprises more control and sovereignty over their data by allowing them to host their own AI infrastructure. This monorepo integrates a modern Next.js web application, a robust API, and a suite of specialized microservices for document processing, PDF generation, and web scraping (via Firecrawl). The architecture leverages PostgreSQL with `pgvector` for efficient vector embeddings, enabling powerful semantic search and Retrieval-Augmented Generation (RAG) capabilities.

> [!WARNING]
> There is currently a bug in firecrawl that can lead to a waterfall behaviour: https://github.com/firecrawl/firecrawl/issues/2350
>
> Until this issue is fixed, it is not recommended to use firecrawl

## Hosted on AWS

Follow the instructions in the `apps/infrastructure/aws/DEPLOYMENT_GUIDE.md` file to deploy the application to AWS.

## Hosted on Google Cloud

Follow the instructions in the `apps/infrastructure/gcloud/DEPLOYMENT_GUIDE.md` file to deploy the application to Google Cloud.

## Local Docker Setup

The Docker Compose in this directory allows you to run all services locally for testing purposes.

## Services Included

- **PostgreSQL Database**: PostgreSQL with pgvector and pg_cron extensions
- **Redis**: Redis instance with AOF persistence
- **MinIO**: S3-compatible object storage for local file storage
- **Keycloak**: Identity and access management for testing SSO integration
- **Firecrawl API**: Web scraping and crawling service (optional)
- **Playwright Service**: Headless browser service for Firecrawl (optional)
- **Document Processor**: Document processing job
- **API**: Custom API service
- **PDF Exporter**: PDF export service
- **Web**: Main application service
- **Dashboard**: Dashboard service

API, PDF Exporter, Web, and Dashboard services can also be started using `pnpm run dev`, which provides hot-reloading for development and is thus recommended.

## Prerequisites

- Docker and Docker Compose installed
- Custom Docker images built:
  - `firecrawl-postgres:latest` - PostgreSQL with pgvector and pg_cron extensions
  - `firecrawl-api:latest` - Firecrawl API service (if using Firecrawl)
  - `firecrawl-playwright:latest` - Playwright service (if using Firecrawl)
- Access to the drizzle migrations in `packages/server/src/drizzle`

### Building Custom Docker Images

#### PostgreSQL with Extensions

```bash
cd apps/postgres
docker build -t firecrawl-postgres .
```

#### Firecrawl Services (Optional)

Comment out the firecrawl services in the `docker-compose.yml` if you do not plan to use web scraping functionality and modify the environment variables accordingly.

## Port Mapping

The services are exposed on the following local ports:

| Service            | Local Port | Container Port |
| ------------------ | ---------- | -------------- |
| PostgreSQL         | 5432       | 5432           |
| Redis              | 6379       | 6379           |
| MinIO              | 9000       | 9000           |
| MinIO Console      | 9001       | 9001           |
| Keycloak           | 8080       | 8080           |
| Web App            | 3000       | 3000           |
| Dashboard          | 3001       | 3000           |
| API                | 3004       | 8080           |
| PDF Exporter       | 3005       | 8080           |
| Firecrawl API      | 3007       | 8080           |
| Playwright Service | 3008       | 3008           |

## Environment Configuration

The `.env` file in the root directory contains all the necessary environment variables. Make sure to:

1. Update the secrets (passwords, keys) before running in any shared environment
2. Configure SMTP settings if you need email functionality

## Usage

### PostgreSQL with pgvector and pg_cron

- **Image**: `firecrawl-postgres:latest` (based on `pgvector/pgvector:pg18`)
- **Port**: `5432`
- **Extensions**: uuid-ossp, pg_trgm, pgvector, pg_cron
- **Schema**: Automatically initialized from Drizzle migrations on first startup

### Redis

- **Image**: `redis:7.2.11-alpine`
- **Port**: `6379`
- **Persistence**: Enabled with AOF (Append Only File)

### MinIO

- **Image**: `minio/minio:RELEASE.2025-07-23T15-54-02Z`
- **Ports**: `9000` (API), `9001` (Console)
- **Buckets**: Automatically creates `files-bucket` and `temporary-files-bucket` on startup
- **Credentials**: Set via `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD` in `.env`

### Keycloak

- **Image**: `quay.io/keycloak/keycloak:latest`
- **Port**: `8080`
- **Admin Console**: http://localhost:8080
- **Credentials**: Set via `KEYCLOAK_ADMIN` and `KEYCLOAK_ADMIN_PASSWORD` in `.env`
- **Purpose**: Local SSO testing and development

### Firecrawl (Optional)

- **API Image**: `firecrawl:latest`
- **API Port**: `3007`
- **Playwright Service Image**: `firecrawl-playwright:latest`
- **Playwright Port**: `3008`
- **Purpose**: Web scraping and crawling for context

## Quick Start

1. **Build required Docker images**:

   a. **Build document-processor** (for local document processing jobs):

   ```bash
   docker build -t mono-document-processor:latest -f apps/document-processor/Dockerfile .
   ```

   b. **Build firecrawl-postgres** (PostgreSQL with pgvector and pg_cron extensions):

   ```bash
   cd apps/postgres
   docker build -t firecrawl-postgres .
   cd ../..
   ```

   c. **Build Firecrawl images** (optional, if you want to use firecrawl):

   ```bash
   # Clone the official Firecrawl repository
   git clone https://github.com/firecrawl/firecrawl.git
   cd firecrawl

   # Build the Docker images
   cd api
   docker build -t firecrawl-api .

   cd ../playwright-service
   docker build -t firecrawl-playwright .

   # Return to the project root
   cd ..
   ```

2. **Copy the environment file**:

   ```bash
   cp .env.example .env
   ```

3. **Update the `.env` file** with your configuration.

4. **Start the core services**:

   ```bash
   docker-compose up -d postgres redis minio minio-init keycloak
   ```

5. **Optionally start Firecrawl** (if you need web scraping):

   ```bash
   docker-compose up -d firecrawl-api playwright-service
   ```

6. **Start other services using pnpm** (recommended for hot-reloading):

   ```bash
   pnpm run dev
   ```

   Hint: Use the --filter option to start specific services, e.g.,

   ```bash
   pnpm run dev --filter=web --filter=api
   ```

7. **Check service health**:

   ```bash
   docker-compose ps
   ```

8. **View logs**:
   ```bash
   docker-compose logs -f postgres
   docker-compose logs -f redis
   docker-compose logs -f keycloak
   ```

## Database Initialization

On first startup, the PostgreSQL container will automatically:

1. Enable required extensions (uuid-ossp, pg_trgm, pgvector, pg_cron)
2. Run the Drizzle schema migrations from `packages/server/src/drizzle`
3. Create all tables, indexes, and constraints

The database is ready to use once the health check passes.

## Setting Up Keycloak for SSO Testing

Keycloak is included in the Docker Compose setup to enable local testing of SSO (Single Sign-On) integration. If you have enabled it (ENABLE_SSO), follow these steps to configure it:

### 1. Access Keycloak Admin Console

Once Keycloak is running, access the admin console:

- **URL**: http://localhost:8080
- **Username**: `admin` (or as set in `KEYCLOAK_ADMIN` in `.env`)
- **Password**: `admin` (or as set in `KEYCLOAK_ADMIN_PASSWORD` in `.env`)

### 2. Create a Realm

1. In the left sidebar, click **"Manage Realms"**
2. Click **"Create Realm"**
3. Set the realm name to `test-realm`
4. Click **"Create"**

### 3. Create a Client

1. In the left sidebar, click **"Clients"**
2. Click **"Create client"**
3. Configure the client:
   - **Client Type**: `OpenID Connect`
   - **Client ID**: `test-client`
   - **Client Name**: Any name (e.g., `Test Client`)
   - Click **"Next"**
4. Configure settings:
   - You can leave defaults
   - Click **"Next"**
5. Set URIs:
   - **Root URL**: `http://localhost:3000`
   - **Home URL**: `http://localhost:3000`
   - **Valid Redirect URIs**: `http://localhost:3004/api/auth/sso/callback/keycloak-test`
   - **Valid post logout redirect URIs**: `http://localhost:3000` and `http://localhost:3001`
   - **Web Origins**: `*` (for development only)
6. Click **"Save"**

### 5. Create a Test User

1. In the left sidebar, click **"Users"**
2. Click **"Create new user"**
3. Fill in the details:
   - **Username**: `testuser`
   - **Email**: `testuser@example.com`
   - **Email verified**: ON
   - **First name**: `Test`
   - **Last name**: `User`
4. Click **"Create"**
5. Go to the **"Credentials"** tab
6. Click **"Set password"**
7. Enter a password and set **Temporary** to OFF
8. Click **"Save"**

### 6. Configure Application Environment Variables

Update your `.env` file with the following SSO configuration:

```bash
# SSO Configuration
ENABLE_SSO="true"
SSO_DOMAIN="example.com"
SSO_PROVIDER_ID="keycloak-test"
SSO_CLIENT_ID="test-client"
SSO_CLIENT_SECRET="test-secret"
SSO_ISSUER="http://localhost:8080/realms/test-realm"
SSO_AUTHORIZATION_ENDPOINT="http://localhost:8080/realms/test-realm/protocol/openid-connect/auth"
SSO_DISCOVERY_ENDPOINT="http://localhost:8080/realms/test-realm/.well-known/openid-configuration"
SSO_TOKEN_ENDPOINT="http://localhost:8080/realms/test-realm/protocol/openid-connect/token"
SSO_JWKS_ENDPOINT="http://localhost:8080/realms/test-realm/protocol/openid-connect/certs"
```

### 7. Test SSO Login

1. Restart your API service to pick up the new environment variables
2. Navigate to your web application (http://localhost:3000)
3. Click on the SSO login option
4. You should be redirected to Keycloak
5. Log in with your test user credentials
6. You should be redirected back to your application, now authenticated

### 8. Verify SSO Configuration

You can verify the OpenID Connect configuration by visiting:
http://localhost:8080/realms/test-realm/.well-known/openid-configuration

This will show you all the endpoints and capabilities of your Keycloak realm.

### Troubleshooting SSO

- **Invalid redirect URI**: Ensure the redirect URI in Keycloak exactly matches `http://localhost:3004/api/auth/sso/callback/keycloak-test`
- **CORS errors**: Make sure Web Origins is set to `*` or includes your application URLs
- **Connection refused**: Check that Keycloak is running with `docker-compose ps keycloak`

### SSO Domain Matching

The SSO integration uses domain-based matching. When a user with an email address matching the `SSO_DOMAIN` tries to log in, they will be automatically redirected to Keycloak for authentication. For testing purposes, you can set `SSO_DOMAIN` to any domain you control or use for testing.

## Drizzle Migrations

The project uses Drizzle ORM for database management. Migration files are located in `packages/server/src/drizzle/`.

### Initial Setup

The Docker Compose setup automatically runs the initial migrations on first startup by mounting the migration SQL files into the PostgreSQL container's `/docker-entrypoint-initdb.d/` directory.

### Generate a New Migration

```bash
cd packages/server
pnpm drizzle-kit generate
```

This creates a new SQL migration file in `packages/server/src/drizzle/`.

### Apply Migrations Manually

If you create new migrations after the initial setup:

```bash
cd packages/server

# Push schema changes directly to the database
pnpm drizzle-kit push

# Or run migrations
pnpm drizzle-kit migrate
```

### View the Database in Drizzle Studio

Drizzle Studio provides a visual interface to browse your database:

```bash
cd packages/server
pnpm drizzle-kit studio
```

This will open a web interface (usually at http://localhost:4983) where you can:

- Browse all tables and their data
- Execute queries
- View relationships
- Inspect indexes and constraints

### Resetting the Database

To reset the database and re-run migrations:

```bash
# Stop and remove the database volume
docker-compose down -v postgres

# Start PostgreSQL again (migrations will run automatically)
docker-compose up -d postgres
```

## Managing Services

### Stop services:

```bash
docker-compose down
```

### Stop and remove volumes (deletes all data):

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

### Access MinIO CLI:

```bash
# List buckets
docker exec -it minio mc ls myminio

# List files in a bucket
docker exec -it minio mc ls myminio/files-bucket
```

### View Keycloak logs:

```bash
docker-compose logs -f keycloak
```

### Environment Variables for Development

Each service that is not run via Docker Compose needs its own environment configuration:

- **Root `.env`**: Shared configuration for Docker services
- **`apps/api/.env`**: API-specific configuration
- **`apps/web/.env.local`**: Web app configuration
- **`apps/dashboard/.env.local`**: Dashboard configuration
- **`apps/pdf-exporter/.env`**: PDF Exporter configuration
- **`packages/server/.env`**: Database connection for Drizzle CLI

Make sure to copy the `.env.example` files in each directory and configure them appropriately.

### Hot Reloading

When running with `pnpm run dev`:

- TypeScript files are watched and recompiled automatically
- Changes to code trigger automatic restarts
- No need to rebuild Docker images during development
- Much faster iteration cycle

### When to Use Docker vs pnpm dev

**Use Docker for:**

- PostgreSQL, Redis, MinIO, Keycloak (infrastructure)
- Firecrawl services (if using web scraping)

**Use pnpm dev for:**

- API (faster TypeScript compilation)
- PDF Exporter (faster development)
- Web app (Next.js hot-reload)
- Dashboard (Next.js hot-reload)

## Troubleshooting

### Database connection refused

- Ensure the container is running: `docker-compose ps`
- Check logs: `docker-compose logs postgres`
- Verify the port is not in use

### Schema not initialized

- Check if the migration files exist in `packages/server/src/drizzle`
- View initialization logs: `docker-compose logs postgres`

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
- **Password**: Value from `DATABASE_PASSWORD` in `.env`
- **Database**: `postgres`
- **Connection String**: `postgresql://postgres:${DATABASE_PASSWORD}@localhost:5432/postgres`

### Redis

- **Host**: `localhost`
- **Port**: `6379`
- **Connection String**: `redis://localhost:6379`

### MinIO

- **API Endpoint**: `http://localhost:9000`
- **Console**: `http://localhost:9001`
- **Access Key**: Value from `MINIO_ROOT_USER` in `.env`
- **Secret Key**: Value from `MINIO_ROOT_PASSWORD` in `.env`
- **Buckets**: `files-bucket`, `temporary-files-bucket`

### Keycloak

- **Admin Console**: `http://localhost:8080`
- **Admin User**: `admin`
- **Admin Password**: `admin`
- **Realm**: `test-realm` (after setup)

## Performance Tuning

The PostgreSQL service is configured with:

- `shared_preload_libraries=vector,pg_cron`: Preload pgvector and pg_cron extensions

You can adjust PostgreSQL settings in the `docker-compose.yml` file under the `postgres` service command section.

## Troubleshooting

### Common Issues

1. **Port conflicts**:
   - Make sure the ports (5432, 6379, 8080, 9000, 9001, etc.) aren't already in use
   - On Windows: Use `netstat -ano | findstr :<port>` to check
   - On Mac/Linux: Use `lsof -i :<port>` to check

2. **PostgreSQL image not found**:
   - Build the custom image: `cd apps/postgres && docker build -t firecrawl-postgres .`

3. **MinIO buckets not created**:
   - Check minio-init logs: `docker-compose logs minio-init`
   - Ensure MinIO is healthy before minio-init runs

4. **Database connection issues**:
   - Check that PostgreSQL is healthy: `docker-compose ps postgres`
   - Verify DATABASE_PASSWORD in `.env` matches across all services
   - Wait for health check to pass before connecting

5. **Keycloak not accessible**:
   - Check if port 8080 is available
   - View logs: `docker-compose logs keycloak`
   - Wait for Keycloak to fully start

6. **SSO not working**:
   - Verify all SSO environment variables are set correctly
   - Ensure redirect URI in Keycloak exactly matches the callback URL
   - Check API logs for authentication errors

7. **Firecrawl errors**:
   - Ensure both firecrawl-api and playwright-service are running
   - Check logs: `docker-compose logs firecrawl-api playwright-service`
   - Verify Firecrawl images are built

## Notes

- This setup is intended for development and testing only
- Make sure to update all default passwords and secrets before any shared usage
- The `USE_LOCAL_TASKS_CLIENT` flag determines whether to use a local tasks client or a cloud-based tasks client. If using cloud-based, the corresponding infrastructure must be set up.
- The `USE_LOCAL_FILE_STORAGE` flag determines whether to use MinIO (true) or cloud storage (false)
- If using cloud storage, the `USE_CLOUDFLRARE_R2` flag determines whether Cloudflare R2 or the configured cloud storage is used
- The `USE_OPENAI_API` flag determines whether to use OpenAI's API. If false, the api from the configured cloud provider is used.
