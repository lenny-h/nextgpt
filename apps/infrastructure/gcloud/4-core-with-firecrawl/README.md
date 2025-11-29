# 4-core-with-firecrawl - Core Application Services (With Firecrawl)

This folder sets up the core application services with Firecrawl integration for advanced web scraping.

## What it provisions

- **Cloud Run Services**:
  - API service (public-facing via Load Balancer)
  - Document Processor service (internal only)
  - PDF Exporter service (public-facing via Load Balancer)
  - Firecrawl API service (internal only, for web scraping)
  - Firecrawl Playwright service (internal only, for browser automation)
- **Application Load Balancer** with SSL/TLS certificate and Cloud Armor protection
- **IAM roles and policies** for all services
- **Cloud Tasks queue** for document processing
- **Service accounts** with least-privilege permissions
- **Secret Manager secrets** for application configuration (auth, OAuth, R2, encryption, etc.)

## Dependencies

This module imports state from:

- `2-db-storage` - VPC, subnets, database endpoints, Redis, and secrets

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

4. Follow the output instructions for DNS and frontend setup.

```bash
terraform output setup_instructions
```

## Important Notes

- This setup **INCLUDES** Firecrawl services for advanced web scraping
- `USE_FIRECRAWL` is set to `true` in the API service
- If you don't need Firecrawl, use `3-core` instead for a simpler setup
- Firecrawl services require more resources (2 CPU, 2GB memory each)
- SSL certificates are automatically managed by Google
- Cloud Armor provides DDoS protection with rate limiting

## Firecrawl Services

This setup includes:

- **Firecrawl API**: Main service that handles web scraping requests
- **Firecrawl Playwright**: Browser automation service for JavaScript-heavy sites

## Next Step

After running this, proceed to either:

- `5-file-storage` for GCS permanent file storage
- `6-cloudflare-storage` for Cloudflare R2 permanent file storage
