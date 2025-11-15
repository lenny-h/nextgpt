# Step 5: Cloudflare R2 Storage

Create Cloudflare R2 buckets for file storage (S3-compatible alternative).

## Prerequisites

- Step 2 or 3 completed
- Cloudflare account with R2 enabled

## What This Creates

- R2 bucket for files
- R2 bucket for temporary files

## Deployment

1. Create Cloudflare API token with R2 permissions
2. Copy `terraform.tfvars.example` to `terraform.tfvars`
3. `terraform init`
4. `terraform apply`
5. Create R2 API credentials in Cloudflare Dashboard

## Configuration

Set `use_cloudflare_r2 = true` in core services.
