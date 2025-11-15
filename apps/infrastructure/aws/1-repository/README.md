# 1-repository - Container Registry Setup

This folder sets up the ECR (Elastic Container Registry) repositories for all container images.

## What it provisions

- ECR repositories for all services:
  - api
  - document-processor
  - pdf-exporter
  - db-migrator
  - firecrawl-api
  - firecrawl-playwright
- Lifecycle policies to keep only the last 5 images per repository

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

4. After applying, push images to the registry:

```bash
cd ../scripts
bash build_and_push_images.sh <account_id> <region> <project_name>
```

## Outputs

This module exports ECR repository URLs and ARNs that will be imported by subsequent infrastructure layers.

## Next Step

After running this, proceed to `2-db-storage` to set up networking and databases.
