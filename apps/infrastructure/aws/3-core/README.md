# 3-core - Core Application Services (Without Firecrawl)

This folder sets up the core application services without Firecrawl integration.

## What it provisions

- **ECS Services**:
  - API service (public-facing via ALB)
  - Document Processor service (internal only)
  - PDF Exporter service (public-facing via ALB)
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

4. Configure DNS:

```bash
# Get DNS validation records for SSL certificate
terraform output dns_validation_records

# Add CNAME record pointing api.your-domain.com to the ALB DNS name
terraform output load_balancer_dns_name
```

5. Configure GitHub Actions:

```bash
# Add this to your GitHub repository variables
terraform output github_actions_role_arn
```

## Outputs

This module exports:

- Load Balancer DNS name and ARN
- SSL Certificate ARN and validation records
- ECS Service and Task Definition details
- SQS Queue URL
- IAM Role ARNs
- Setup Instructions (DNS, GitHub Variables)

Run `terraform output setup_instructions` to see detailed next steps.

## Important Notes

- This setup does **NOT** include Firecrawl services
- USE_FIRECRAWL is set to false in the API service
- If you need Firecrawl, use `4-core-with-firecrawl` instead

## Next Step

After running this, proceed to either:

- `5-file-storage` for AWS S3 permanent file storage
- `6-cloudflare-storage` for Cloudflare R2 permanent file storage
