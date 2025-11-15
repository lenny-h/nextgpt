# 6-cloudflare-storage - Cloudflare R2 for Permanent Files

This folder sets up Cloudflare R2 for permanent file storage.

## What it provisions

- Cloudflare R2 bucket for permanent file storage

## When to use this

Use this module if you want to store files in Cloudflare R2 instead of Google Cloud Storage. This is typically chosen when:

- You want lower egress costs (R2 has no egress fees)
- You're using Cloudflare for other services (CDN, DNS, etc.)
- You want S3-compatible storage without AWS
- You need globally distributed storage with automatic replication

## Dependencies

This module is standalone but should be used instead of `5-file-storage`, not in addition to it.

## Prerequisites

Before deploying:

1. Sign up for Cloudflare R2 (requires a Cloudflare account)
2. Get your Cloudflare Account ID from the dashboard
3. Create a Cloudflare API token with R2 permissions

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

4. Create R2 API credentials:

After the bucket is created:

- Go to Cloudflare Dashboard > R2 > Manage R2 API Tokens
- Create a new API token with Object Read & Write permissions for your bucket
- Save the Access Key ID and Secret Access Key

5. Update your core infrastructure secrets:

Add the R2 credentials to `2-db-storage/terraform.tfvars`:

```
cloudflare_access_key_id     = "your-access-key-id"
cloudflare_secret_access_key = "your-secret-access-key"
```

Then apply the changes to `2-db-storage`:

```bash
cd ../2-db-storage
terraform apply
```

6. Update your application configuration:

Ensure your core infrastructure (3-core or 4-core-with-firecrawl) has:

- `use_cloudflare_r2 = true`
- `r2_endpoint = "https://YOUR-ACCOUNT-ID.r2.cloudflarestorage.com"`

## Important Notes

- R2 is S3-compatible, so your application can use S3 SDKs
- No egress fees for data read from R2
- Automatic global replication for data durability
- Compatible with existing S3 tools and libraries

## Costs

Cloudflare R2 pricing (as of 2024):

- Storage: $0.015 per GB/month
- Class A operations (writes): $4.50 per million
- Class B operations (reads): $0.36 per million
- **No egress fees**

## Alternative

If you prefer to use Google Cloud Storage for file storage, use `5-file-storage` instead.
