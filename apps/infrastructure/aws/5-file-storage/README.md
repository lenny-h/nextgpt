# Step 4: S3 Storage

Create S3 buckets for file storage.

## Prerequisites

- Step 2 or 3 completed

## What This Creates

- S3 bucket for files
- S3 bucket for temporary files (with lifecycle policy)
- CORS configuration
- Encryption enabled

## Deployment

1. Copy `terraform.tfvars.example` to `terraform.tfvars`
2. `terraform init`
3. `terraform apply`

## Configuration

Set `use_cloudflare_r2 = false` in core services.
