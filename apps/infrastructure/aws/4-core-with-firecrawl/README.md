# 4-core-with-firecrawl - Core Application Services (With Firecrawl)

This folder sets up the core application services **with** Firecrawl integration for advanced web scraping.

## What it provisions

- **ECS Services**:
  - API service (public-facing via ALB)
  - Document Processor service (internal only)
  - PDF Exporter service (public-facing via ALB)
  - **Firecrawl API service** (internal only)
  - **Firecrawl Playwright service** (internal only)
- **Application Load Balancer** with SSL/TLS certificate
- **IAM roles and policies** for all services
- **Secrets Manager** secrets for sensitive configuration
- **SQS queue** for document processing
- **EventBridge Scheduler** for scheduled tasks
- **Service Discovery** namespace for internal communication
- **GitHub Actions OIDC** role for CI/CD

## Dependencies

This module imports state from:

- `1-repository` - ECR repository URLs
- `2-db-storage` - VPC, subnets, security groups, database endpoints, ECS cluster

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

## Outputs

This module exports:

- Load Balancer DNS name and ARN
- SSL Certificate ARN and validation records
- ECS Service and Task Definition details
- SQS Queue URL
- IAM Role ARNs
- Setup Instructions (DNS, GitHub Variables)

## Important Notes

- This setup **INCLUDES** Firecrawl services for web scraping
- USE_FIRECRAWL is controlled by the `use_firecrawl` variable
- Firecrawl services run internally and are not exposed to the internet
- If you don't need Firecrawl, use `3-core` instead

## Next Step

After running this, proceed to either:

- `5-file-storage` for AWS S3 permanent file storage
- `6-cloudflare-storage` for Cloudflare R2 permanent file storage
