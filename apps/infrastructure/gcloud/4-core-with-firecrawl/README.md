# Step 3: Core Infrastructure (With Firecrawl)

This directory sets up the complete core application infrastructure INCLUDING Firecrawl services.

## Prerequisites

- Step 1 (repository) completed successfully
- Docker images pushed to Artifact Registry
- Terraform installed
- Google Cloud CLI configured

## What This Creates

### Network & Compute

- VPC network and subnet
- Private service connection
- Cloud Run services: API, Document Processor, PDF Exporter, Firecrawl API, Firecrawl Playwright
- Load balancer with SSL certificate
- Cloud Armor security policy

### Database & Cache

- Cloud SQL PostgreSQL instance
- Redis instance
- Cloud Tasks queue

### IAM & Security

- Service accounts for each service
- IAM bindings and permissions
- Secret Manager secrets
- CI/CD service account

## Deployment Steps

1. Copy `terraform.tfvars.example` to `terraform.tfvars` and fill in your values:

   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

2. Initialize Terraform:

   ```bash
   terraform init
   ```

3. Plan and review:

   ```bash
   terraform plan
   ```

4. Apply:

   ```bash
   terraform apply
   ```

5. Note the outputs for DNS configuration and GitHub secrets

## After Deployment

1. Add the DNS A record to your DNS provider (output: `dns_a_record`)
2. Add GitHub secrets and variables (outputs: `github_secret`, `github_variables`)
3. Run database migrations:
   ```bash
   gcloud run jobs execute db-migrator --region=<region>
   ```

## Storage Options

After this step, you must deploy either:

- `4-storage/` - Use Google Cloud Storage
- `5-cloudflare/` - Use Cloudflare R2 (recommended)

## Important Notes

- This configuration INCLUDES Firecrawl services for web crawling capabilities
- For a lighter deployment without Firecrawl, use `2-core/` instead
- Set `use_cloudflare_r2 = false` if using GCS storage (step 4)
- Set `use_cloudflare_r2 = true` if using Cloudflare R2 (step 5)
- Set `use_firecrawl = true` to enable Firecrawl features in the application
