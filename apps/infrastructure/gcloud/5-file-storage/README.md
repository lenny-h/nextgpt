# Step 4: Google Cloud Storage

This directory sets up Google Cloud Storage buckets for file storage.

## Prerequisites

- Either Step 2 (core) or Step 3 (core-with-firecrawl) completed
- Terraform installed
- Google Cloud CLI configured

## What This Creates

- **Temporary Files Bucket**: For short-lived files (auto-deleted after 1 day)
- **Files Bucket**: For permanent file storage

Both buckets include:

- CORS configuration for web access
- Private access enforcement
- Uniform bucket-level access

## Deployment Steps

1. Copy `terraform.tfvars.example` to `terraform.tfvars` and fill in your values:

   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

2. Initialize Terraform:

   ```bash
   terraform init
   ```

3. Apply:
   ```bash
   terraform apply
   ```

## Configuration

When deploying core services (Step 2 or 3), ensure:

- Set `use_cloudflare_r2 = false` in your core terraform.tfvars
- The application will automatically use Google Cloud Storage

## Alternative

If you prefer Cloudflare R2 instead, use `5-cloudflare/` instead of this step.

## IAM Permissions

The service accounts created in Step 2/3 already have the necessary permissions to access these buckets through their IAM bindings.
