# Google Cloud Infrastructure

This directory contains the Terraform configuration for deploying the application infrastructure on Google Cloud Platform (GCP).

## Architecture Overview

The infrastructure is organized into **6 sequential layers**, each building upon the previous one using Terraform remote state management:

```
1-repository         → Artifact Registry
↓
2-db-storage         → VPC + Cloud SQL + Redis + Cloud Run Setup
↓
3-core               → Cloud Run Services (without Firecrawl)
  OR
4-core-with-firecrawl → Cloud Run Services (with Firecrawl)
↓
5-file-storage       → Cloud Storage
  OR
6-cloudflare-storage → Cloudflare R2
```

## Layer Details

### 1. Container Registry (`1-repository/`)

- **Purpose**: Artifact Registry for Docker images
- **Resources**: Single Docker repository with cleanup policy (keeps last 5 images)
- **Outputs**: Registry URLs for all container images

### 2. Database & Storage (`2-db-storage/`)

- **Purpose**: Core infrastructure layer
- **Resources**:
  - VPC with private subnet and VPC Access Connector
  - Cloud SQL PostgreSQL 16 (managed database)
  - Cloud Memorystore Redis 7 (managed cache)
  - Cloud NAT for outbound internet access
  - Service Account for Cloud Run with appropriate IAM roles
  - DB Migrator Cloud Run Job
- **Outputs**: VPC, database, Redis endpoints and credentials

### 3. Core Services (`3-core/`)

- **Purpose**: Application services WITHOUT Firecrawl
- **Resources**:
  - Cloud Run services: API, Document Processor, PDF Exporter
  - Global HTTPS Load Balancer with SSL certificate
  - Cloud Tasks queue for async processing
  - Cloud Scheduler for cleanup jobs
  - Temporary Cloud Storage (1-day lifecycle)
  - Secret Manager for OAuth and encryption keys
- **Environment**: `USE_FIRECRAWL=false`

### 4. Core with Firecrawl (`4-core-with-firecrawl/`)

- **Purpose**: Alternative to layer 3 WITH Firecrawl
- **Resources**: All layer 3 resources PLUS:
  - Firecrawl API Cloud Run service
  - Firecrawl Playwright Cloud Run service
  - Additional secrets for Firecrawl API key
- **Environment**: `USE_FIRECRAWL=true`
- **Note**: Deploy EITHER layer 3 OR layer 4, not both

### 5. File Storage - Cloud Storage (`5-file-storage/`)

- **Purpose**: Google Cloud Storage for permanent files
- **Resources**:
  - Cloud Storage bucket with versioning
  - IAM bindings for Cloud Run services
  - Lifecycle policy (keeps last 3 versions)
- **Use when**: You want GCP-native storage

### 6. File Storage - Cloudflare R2 (`6-cloudflare-storage/`)

- **Purpose**: Cloudflare R2 for permanent files (S3-compatible, no egress fees)
- **Resources**:
  - Cloudflare R2 bucket
  - Secret Manager for R2 credentials
- **Use when**: You have high egress/download volume
- **Note**: Deploy EITHER layer 5 OR layer 6, not both

## Prerequisites

- Google Cloud Project with billing enabled
- `gcloud` CLI installed and configured
- Terraform >= 1.0 installed
- Docker installed (for building images)
- Domain name for SSL certificate (optional for layer 3/4)

## Quick Start

### 1. Deploy Container Registry

```bash
cd 1-repository
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
terraform init
terraform apply
```

### 2. Build and Push Images

```bash
cd ../scripts
bash build_and_push_images.sh your-project-id us-central1 myapp

# If not using Firecrawl:
bash build_and_push_images.sh your-project-id us-central1 myapp --skip-firecrawl
```

### 3. Deploy Database Layer

```bash
cd ../2-db-storage
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars
terraform init
terraform apply

# Run database migrations
gcloud run jobs execute myapp-db-migrator --region us-central1
```

### 4. Deploy Core Services

Choose ONE:

**Option A: Without Firecrawl**

```bash
cd ../3-core
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars
terraform init
terraform apply
```

**Option B: With Firecrawl**

```bash
cd ../4-core-with-firecrawl
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars (include Firecrawl API key)
terraform init
terraform apply
```

### 5. Configure DNS

```bash
# Get load balancer IP
terraform output load_balancer_ip

# Add A record to your DNS:
# Type: A
# Name: api (or your subdomain)
# Value: <LOAD_BALANCER_IP>
```

### 6. Deploy File Storage

Choose ONE:

**Option A: Cloud Storage**

```bash
cd ../5-file-storage
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform apply
```

**Option B: Cloudflare R2**

```bash
cd ../6-cloudflare-storage
cp terraform.tfvars.example terraform.tfvars
# Add Cloudflare credentials
terraform init
terraform apply
```

## Deployment Order

**Critical**: Layers must be deployed in order!

1. `1-repository` → Build images → Push to registry
2. `2-db-storage` → Run migrations
3. `3-core` OR `4-core-with-firecrawl` → Configure DNS
4. `5-file-storage` OR `6-cloudflare-storage`

## State Management

### Local State (Development)

By default, each layer uses local Terraform state stored in `terraform.tfstate` files. This is suitable for development and testing.

### Remote State (Production)

For production, use Cloud Storage backend:

1. Create a Cloud Storage bucket for state:

```bash
gsutil mb -l us-central1 gs://your-project-terraform-state
gsutil versioning set on gs://your-project-terraform-state
```

2. Uncomment the `backend "gcs"` block in each layer's `providers.tf`

3. Run `terraform init -migrate-state` in each layer

## Cost Estimates

Approximate monthly costs for a small production deployment:

| Layer                        | Resources                       | Monthly Cost       |
| ---------------------------- | ------------------------------- | ------------------ |
| 1-repository                 | Artifact Registry (10GB)        | $1-2               |
| 2-db-storage                 | VPC, Cloud SQL, Redis, NAT      | $102-135           |
| 3-core                       | Cloud Run, Load Balancer, Tasks | $40-76             |
| 4-core (with Firecrawl)      | +Firecrawl services             | +$30-50            |
| 5-file-storage               | Cloud Storage (100GB)           | $2-3               |
| 6-cloudflare-storage         | R2 (100GB)                      | $1.50              |
| **Total (3-core + Storage)** |                                 | **$145-216/month** |
| **Total (4-core + Storage)** |                                 | **$175-286/month** |

**Cost Optimization Tips:**

- Use `db-f1-micro` and `BASIC` Redis tier for dev/staging
- Set min_instances=0 for non-critical services (scale to zero)
- Choose Cloudflare R2 if you have high download volume
- Use committed use discounts for production workloads

## Monitoring & Logs

View logs for all services:

```bash
# Cloud Run logs
gcloud logging read "resource.type=cloud_run_revision" --limit 100

# Specific service
gcloud logging read "resource.labels.service_name=myapp-api" --limit 50

# Cloud SQL logs
gcloud logging read "resource.type=cloudsql_database" --limit 50
```

## Cleanup

To destroy all infrastructure (in reverse order):

```bash
cd 6-cloudflare-storage  # or 5-file-storage
terraform destroy

cd ../4-core-with-firecrawl  # or 3-core
terraform destroy

cd ../2-db-storage
terraform destroy

cd ../1-repository
terraform destroy
```

## Troubleshooting

### Cloud Run Service Won't Start

- Check logs: `gcloud run services logs read SERVICE_NAME`
- Verify VPC connector is healthy
- Check Secret Manager permissions

### Database Connection Issues

- Verify VPC Access Connector is attached to Cloud Run
- Check Cloud SQL private IP connectivity
- Verify service account has `cloudsql.client` role

### SSL Certificate Stuck

- Verify DNS A record is correct
- DNS propagation can take 10-30 minutes
- Check certificate status: `gcloud compute ssl-certificates list`

### Image Push Fails

- Authenticate: `gcloud auth configure-docker us-central1-docker.pkg.dev`
- Verify Artifact Registry API is enabled
- Check IAM permissions on service account

## Security Best Practices

- ✅ All services run in private VPC with VPC Access Connector
- ✅ Secrets stored in Secret Manager (never in code)
- ✅ IAM roles follow principle of least privilege
- ✅ HTTPS-only via Load Balancer with managed SSL
- ✅ Cloud SQL and Redis only accessible via private IP
- ✅ Automatic security updates for managed services

## Additional Documentation

- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Step-by-step deployment instructions
- [INFRASTRUCTURE_OVERVIEW.md](./INFRASTRUCTURE_OVERVIEW.md) - Detailed architecture documentation
- Layer-specific READMEs in each folder

## Support

For issues or questions:

1. Check the README in the specific layer folder
2. Review [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
3. Check Google Cloud documentation
4. Review Terraform state for outputs and resource details
