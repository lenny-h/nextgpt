# 6-cloudflare-storage - Cloudflare R2 File Storage

This folder sets up Cloudflare R2 for permanent file storage.

## What it provisions

- **Cloudflare R2 bucket** for permanent file storage
- R2 is S3-compatible and often more cost-effective than AWS S3

## Dependencies

This module imports state from:

- `1-repository` - ECR repository information
- `2-db-storage` - Infrastructure details
- `3-core` or `4-core-with-firecrawl` - IAM role ARNs

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

3. Update providers.tf to point to the correct core state:
   - If you deployed `3-core`, the default path is correct
   - If you deployed `4-core-with-firecrawl`, update the path in `providers.tf`

4. Apply the configuration:

```bash
terraform apply
```

## Important Notes

- Deploy **either** this OR `5-file-storage`, not both
- This uses Cloudflare R2 for file storage
- R2 is S3-compatible with no egress fees
- Make sure your application is configured with `use_cloudflare_r2 = true`
- You'll need Cloudflare R2 access credentials configured in your core services

## Alternative

If you prefer AWS S3 for file storage, use `5-file-storage` instead.
