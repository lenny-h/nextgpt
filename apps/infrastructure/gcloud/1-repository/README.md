# 1-repository - Artifact Registry Setup

This folder sets up the Artifact Registry repository for all container images.

## What it provisions

- Artifact Registry repository for all services:
  - api
  - document-processor
  - pdf-exporter
  - db-migrator
  - firecrawl
  - firecrawl-playwright
- Cleanup policy to keep only the last 5 images

## Usage

1. Install Gcloud CLI and run:

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud auth application-default login
```

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

4. After applying, authenticate Docker and push images:

```bash
# Authenticate Docker
gcloud auth configure-docker YOUR_REGION-docker.pkg.dev

# Build and push images
cd ../scripts
bash build_and_push_images.sh <project_id> <region>
```

## Outputs

This module exports Artifact Registry repository URLs that will be used by subsequent infrastructure layers.

## Next Step

After running this, proceed to `2-db-storage` to set up networking and databases.
