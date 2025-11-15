# 5-file-storage - Google Cloud Storage for Permanent Files

This folder sets up Google Cloud Storage (GCS) for permanent file storage.

## What it provisions

- GCS bucket for permanent file storage
- CORS configuration for web access
- Uniform bucket-level access for consistent permissions
- Public access prevention for security

## When to use this

Use this module if you want to store files in Google Cloud Storage instead of Cloudflare R2. This is typically chosen when:

- You want to keep all infrastructure within GCP
- You need GCP-specific features or integrations
- You prefer GCP's pricing model for storage

## Dependencies

This module is standalone but should be used instead of `6-cloudflare-storage`, not in addition to it.

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

4. Update your application configuration:

After deployment, you need to:

- Set `USE_CLOUDFLARE_R2=false` in your application environment variables
- Update the core infrastructure (3-core or 4-core-with-firecrawl) to uncomment GCS IAM permissions
- Remove or comment out Cloudflare R2 related environment variables

## Important Notes

- This bucket is for **permanent** file storage (no automatic deletion)
- The temporary files bucket is created in `2-db-storage` with 1-day retention
- CORS is configured for your application domains
- Public access is prevented for security
- Uniform bucket-level access is enabled for consistent IAM

## IAM Configuration

You'll need to grant your application service accounts access to this bucket. In your core infrastructure (3-core or 4-core-with-firecrawl), uncomment the GCS IAM bindings for:

- API service account
- Document Processor service account

## Alternative

If you prefer to use Cloudflare R2 for file storage, use `6-cloudflare-storage` instead.
