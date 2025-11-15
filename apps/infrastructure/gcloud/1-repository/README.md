# Layer 1: Artifact Registry

This layer sets up Google Artifact Registry for storing Docker container images.

## Resources Created

- **Artifact Registry Repository**: Single Docker repository for all container images
- **Cleanup Policy**: Automatically keeps only the last 5 images per tag
- **IAM Bindings**: Allows Cloud Run and Cloud Build to pull images

## Configuration

1. Copy the example variables file:

```bash
cp terraform.tfvars.example terraform.tfvars
```

2. Edit `terraform.tfvars` with your values:

```hcl
project_id   = "your-gcp-project-id"
region       = "us-central1"
project_name = "myapp"
environment  = "production"
```

## Deployment

```bash
# Initialize Terraform
terraform init

# Review the plan
terraform plan

# Apply the configuration
terraform apply
```

## Outputs

After deployment, you'll get:

- `artifact_registry_url`: Full URL for pushing/pulling images
- `docker_image_base_url`: Base URL for constructing image paths
- Individual image URLs for each service

## Building and Pushing Images

After deploying this layer, build and push your Docker images:

```bash
# Authenticate with Artifact Registry
gcloud auth configure-docker us-central1-docker.pkg.dev

# Get the base URL from Terraform output
REGISTRY_URL=$(terraform output -raw docker_image_base_url)

# Build and push images (from monorepo root)
cd ../../../..

# API
docker build -t ${REGISTRY_URL}/myapp-api:latest -f apps/api/Dockerfile .
docker push ${REGISTRY_URL}/myapp-api:latest

# Document Processor
docker build -t ${REGISTRY_URL}/myapp-document-processor:latest -f apps/document-processor/Dockerfile .
docker push ${REGISTRY_URL}/myapp-document-processor:latest

# PDF Exporter
docker build -t ${REGISTRY_URL}/myapp-pdf-exporter:latest -f apps/pdf-exporter/Dockerfile .
docker push ${REGISTRY_URL}/myapp-pdf-exporter:latest

# DB Migrator
docker build -t ${REGISTRY_URL}/myapp-db-migrator:latest -f apps/db-migrator/Dockerfile .
docker push ${REGISTRY_URL}/myapp-db-migrator:latest
```

Or use the provided script:

```bash
cd ../scripts
bash build_and_push_images.sh your-project-id us-central1 myapp
```

## Next Steps

After this layer is deployed and images are pushed, proceed to:

- **Layer 2**: `2-db-storage` for VPC, databases, and networking

## Cost Estimate

- Artifact Registry storage: ~$0.10/GB/month
- Network egress: Standard GCP rates
- Estimated monthly cost: $1-5 (for ~10GB of images)
