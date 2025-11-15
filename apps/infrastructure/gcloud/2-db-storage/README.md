# Step 2: Database & Storage Infrastructure

This directory sets up the database, caching, and networking infrastructure.

## Prerequisites

- Step 1 (repository) completed
- Terraform installed
- Google Cloud CLI configured

## What This Creates

### Networking

- **VPC Network**: Private network for all services
- **Subnet**: Private subnet with IP range 10.0.0.0/24
- **Private Service Connection**: For Cloud SQL and Redis

### Database

- **Cloud SQL PostgreSQL**: Managed PostgreSQL 18 database
  - Instance: db-f1-micro (can be upgraded)
  - Automatic backups with point-in-time recovery
  - Private IP only (no public access)
  - Auto-scaling storage (20GB initial, up to 100GB)

### Caching

- **Redis Instance**: Memorystore for Redis
  - Tier: BASIC (1GB memory)
  - Redis version 7.x
  - Connected to private VPC

### Database Migration

- **DB Migrator**: Cloud Run Job for running database migrations
  - Runs on-demand to apply schema changes
  - Connected to private VPC
  - Has access to database password secret

### Security

- **Secret Manager**: Stores database password securely
- **Service Accounts**: Minimal permissions for DB migrator
- **IAM Bindings**: Least-privilege access control

## Deployment Steps

1. Copy `terraform.tfvars.example` to `terraform.tfvars` and fill in your values:

   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

2. Initialize Terraform:

   ```bash
   terraform init
   ```

3. Plan and apply:

   ```bash
   terraform plan
   terraform apply
   ```

4. Run initial database migration (after applying):
   ```bash
   gcloud run jobs execute db-migrator --region=us-central1
   ```

## Outputs

After deployment, you'll get:

- PostgreSQL private IP and connection name
- Redis host and port
- VPC network details
- DB migrator job name and service account

These outputs will be used by the core services in Step 3/4.

## Important Notes

- **Database Password**: Store this securely! It's used by all services
- **Network**: This VPC will be shared by all Cloud Run services
- **Cost**: db-f1-micro is the smallest instance (~$15/month)
- **Backups**: Enabled by default with 7-day retention

## Connecting from Core Services

Core services (Step 3/4) will automatically reference these resources using Terraform data sources or by reading outputs.

## Next Steps

After successfully deploying this step:

- Run the DB migrator to initialize the database schema
- Proceed to either `3-core/` or `4-core-with-firecrawl/`
