# Step 1: Cloud Repository Setup

This directory sets up the Google Artifact Registry for storing Docker images.

## Prerequisites

- Google Cloud CLI installed and configured and Terraform installed
- Appropriate GCP permissions to create Artifact Registry resources

## What This Creates

- Artifact Registry repository for Docker images
- Enables required APIs

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
   bash build_and_push_images.sh <project_id> <region> [--skip-firecrawl]
   ```

## Next Steps

After successfully deploying this step and pushing images, proceed to either:

- `2-core/` - Deploy core services without Firecrawl
- `3-core-with-firecrawl/` - Deploy core services with Firecrawl
