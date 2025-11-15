# 2-db-storage - Database and Network Infrastructure

This folder sets up the networking infrastructure, databases, and the DB migrator job.

## What it provisions

- VPC with private subnet
- Private service connection for GCP services
- Cloud SQL PostgreSQL database (18) with private IP
- Redis instance in the VPC
- Secret Manager secrets for sensitive configuration
- DB Migrator Cloud Run job
- IAM roles and service accounts

## Dependencies

This module requires the Artifact Registry repository (`app-artifact-repository`) to be created first (see `1-repository`).

## Usage

1. Initialize Terraform:

```bash
terraform init
```

2. Copy and configure variables:

```bash
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
```

3. Apply the configuration:

```bash
terraform apply
```

4. Run database migrations:

After deployment, run the DB migrator job:

```bash
gcloud run jobs execute db-migrator \
  --region=YOUR_REGION \
  --project=YOUR_PROJECT_ID
```

## Important Notes

- The Cloud SQL instance uses private IP only for security
- Redis is configured for basic tier (1GB memory)
- All secrets are stored in Secret Manager
- Service accounts have least-privilege IAM permissions

## Outputs

This module exports:

- VPC network and subnet information
- Database connection details (private IP)
- Redis connection information
- Secret Manager secret IDs
- Service account details

These outputs are used by subsequent infrastructure layers (3-core, 4-core-with-firecrawl).

## Next Step

After running this, proceed to either:

- `3-core` for application services without Firecrawl
- `4-core-with-firecrawl` for application services with Firecrawl
