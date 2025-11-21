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

## Important Notes

- CORS is configured for your application domains
- Public access is prevented for security
- Uniform bucket-level access is enabled for consistent IAM

## Alternative

If you prefer to use Cloudflare R2 for file storage, use `6-cloudflare-storage` instead.
