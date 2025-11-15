# Step 1: ECR Repository Setup

This directory sets up Amazon ECR (Elastic Container Registry) for storing Docker images.

## Prerequisites

- AWS CLI installed and configured and Terraform installed
- Appropriate AWS permissions to create ECR resources

## What This Creates

- ECR repositories for all application images:
  - API
  - Document Processor
  - PDF Exporter
  - Firecrawl API
  - Firecrawl Playwright
- Lifecycle policies to retain only the last 5 images

## Deployment Steps

1. Copy `terraform.tfvars.example` to `terraform.tfvars` and fill in your values:

   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

2. Initialize Terraform:

   ```bash
   terraform init
   ```

3. Plan and apply:

   ```bash
   terraform plan
   terraform apply
   ```

4. After deployment, run the build script to push images:
   ```bash
   cd ../scripts
   bash build_and_push_images.sh <aws_account_id> <region> <project_name> [--skip-firecrawl]
   ```

## Next Steps

After successfully deploying this step and pushing images, proceed to either:

- `2-core/` - Deploy core services without Firecrawl
- `3-core-with-firecrawl/` - Deploy core services with Firecrawl
