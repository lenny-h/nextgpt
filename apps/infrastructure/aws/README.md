# Infrastructure Restructuring

This infrastructure has been restructured into 6 sequential layers, where each layer builds upon the previous one by importing its state.

## Folder Structure

### 1-repository

Sets up container registries (ECR) for all Docker images with lifecycle policies to keep only the last 5 images.

**After deploying this**, run the `scripts/build_and_push_images.sh` script to build and push your images.

### 2-db-storage

Sets up:

- VPC with public/private subnets
- NAT Gateways
- PostgreSQL database
- Redis cache
- DB Migrator task definition
- Core IAM roles and security groups

**Imports state from**: 1-repository

### 3-core

Sets up core application services without Firecrawl:

- ECS services (API, Document Processor, PDF Exporter)
- Application Load Balancer with SSL/TLS
- IAM roles for services
- Secrets Manager secrets
- SQS queue for document processing
- EventBridge Scheduler
- Service Discovery namespace
- S3 bucket for temporary files

**Imports state from**: 1-repository, 2-db-storage

### 4-core-with-firecrawl

Alternative to 3-core that includes Firecrawl services:

- Everything from 3-core, plus:
- Firecrawl API service
- Firecrawl Playwright service
- Additional environment variables for Firecrawl integration

**Imports state from**: 1-repository, 2-db-storage

**Note**: Deploy either 3-core OR 4-core-with-firecrawl, not both.

### 5-file-storage

Sets up AWS S3 for permanent file storage:

- S3 bucket for files
- CORS configuration
- Encryption at rest

**Imports state from**: 1-repository, 2-db-storage, 3-core (or 4-core-with-firecrawl)

### 6-cloudflare-storage

Alternative to 5-file-storage using Cloudflare R2:

- Cloudflare R2 bucket for files
- R2 access configuration

**Imports state from**: 1-repository, 2-db-storage, 3-core (or 4-core-with-firecrawl)

**Note**: Deploy either 5-file-storage OR 6-cloudflare-storage, not both.

## Deployment Order

1. Deploy `1-repository`
2. Run `scripts/build_and_push_images.sh`
3. Deploy `2-db-storage`
4. Deploy `3-core` OR `4-core-with-firecrawl`
5. Deploy `5-file-storage` OR `6-cloudflare-storage`

## State Management

Each folder is configured to import state from previous layers using Terraform remote state. By default, they use local backend, but you should configure S3 backend for production use.

To enable S3 backend, uncomment and configure the `backend "s3"` block in each `providers.tf` file.

## Variable Management

Each folder has its own `variables.tf` and `terraform.tfvars.example`. Copy the example file to `terraform.tfvars` and configure with your values.

Many variables are shared across layers - consider using environment variables or a centralized variable management approach.
