# 5-file-storage - AWS S3 File Storage

This folder sets up AWS S3 for permanent file storage.

## What it provisions

- **S3 bucket** for permanent file storage
- **Bucket policies** for CORS, encryption, and access control
- **IAM policies** to grant API and Document Processor access to the bucket

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

- Deploy **either** this OR `6-cloudflare-storage`, not both
- This uses AWS S3 for file storage
- Files are encrypted at rest with AES-256
- CORS is configured for your application domains

## Alternative

If you prefer Cloudflare R2 for file storage, use `6-cloudflare-storage` instead.
