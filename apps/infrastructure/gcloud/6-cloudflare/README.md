# Step 5: Cloudflare R2 Storage

This directory sets up Cloudflare R2 buckets for file storage as an alternative to Google Cloud Storage.

## Prerequisites

- Either Step 2 (core) or Step 3 (core-with-firecrawl) completed
- Cloudflare account with R2 enabled
- Cloudflare API token with R2 permissions
- Terraform installed

## What This Creates

- **Files Bucket**: For permanent file storage
- **Temporary Files Bucket**: For short-lived files

## Deployment Steps

1. Create a Cloudflare API token with R2 edit permissions:
   - Go to Cloudflare Dashboard > My Profile > API Tokens
   - Create a custom token with "Account.Cloudflare R2" permissions

2. Copy `terraform.tfvars.example` to `terraform.tfvars` and fill in your values:

   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

3. Initialize Terraform:

   ```bash
   terraform init
   ```

4. Apply:

   ```bash
   terraform apply
   ```

5. Create R2 API credentials in Cloudflare Dashboard:
   - Go to R2 > Manage R2 API Tokens
   - Create a new API token
   - Save the Access Key ID and Secret Access Key

## Configuration

When deploying core services (Step 2 or 3), ensure:

- Set `use_cloudflare_r2 = true` in your core terraform.tfvars
- Set `cloudflare_access_key_id` to your R2 access key
- Set `cloudflare_secret_access_key` to your R2 secret key
- Set `r2_endpoint` to your R2 endpoint (e.g., `https://<account-id>.r2.cloudflarestorage.com`)

## Alternative

If you prefer Google Cloud Storage instead, use `4-storage/` instead of this step.

## Benefits of R2

- Lower egress costs compared to GCS
- Global distribution
- S3-compatible API
- No data transfer fees for most operations
