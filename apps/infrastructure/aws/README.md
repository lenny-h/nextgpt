# AWS Infrastructure

This directory contains the Terraform configuration for deploying the application infrastructure on Amazon Web Services (AWS).

## Architecture Overview

The infrastructure is organized into **7 sequential layers**, each building upon the previous one using Terraform remote state management:

```
1-repository            → ECR (Elastic Container Registry)
↓
2-db-storage            → VPC + RDS PostgreSQL + ElastiCache Redis + ECS Cluster
↓
3-core                  → ECS Services (without Firecrawl)
  OR
4-core-with-firecrawl   → ECS Services (with Firecrawl)
↓
5-core-with-certificate → SSL Certificate Update
↓
6-file-storage          → S3 Storage
  OR
7-cloudflare-storage    → Cloudflare R2
```

## Layer Details

### 1. Container Registry (`1-repository/`)

**Purpose**: Provides a private Docker registry for storing application container images.

**Key Resources**:

- **ECR Repositories**: Docker format registries with automatic cleanup
  - Lifecycle policy: Keeps last 5 images per repository
  - Repositories: api, document-processor, pdf-exporter, db-migrator, firecrawl-api, firecrawl-playwright
  - Format: Docker
- **GitHub OIDC Provider**: Enables GitHub Actions to authenticate with AWS without long-lived credentials
  - Allows secure CI/CD deployments
  - Uses OpenID Connect for temporary credentials

**Dependencies**: None (first layer to deploy)

**Provides to Next Layers**:

- ECR repository URLs for pushing/pulling images
- Image paths for all application services
- OIDC provider ARN for GitHub Actions

---

### 2. Database & Storage (`2-db-storage/`)

**Purpose**: Establishes the foundational networking and data infrastructure for all application services.

**Key Resources**:

- **VPC Network**: Private network with public and private subnets
  - CIDR: 10.0.0.0/16
  - Public subnets: 10.0.1.0/24, 10.0.2.0/24 (across 2 AZs)
  - Private subnets: 10.0.101.0/24, 10.0.102.0/24 (across 2 AZs)
  - Internet Gateway: Provides internet access for public subnets
  - NAT Gateways: Provides outbound internet access for private subnets (one per AZ)
- **RDS PostgreSQL 18**: Managed relational database
  - Private subnets only (no public exposure)
  - Instance class: db.t3.micro (configurable)
  - Storage: 20GB with auto-scaling up to 100GB
  - Encrypted at rest with AWS KMS
  - Automated backups (7-day retention)
  - Multi-AZ option available for high availability
- **ElastiCache Redis 7**: Managed in-memory cache
  - Private subnets only
  - Node type: cache.t3.micro (configurable)
  - Used for session storage and caching
- **ECS Cluster**: Container orchestration platform
  - Fargate launch type (serverless containers)
  - Auto-scaling capabilities
- **Security Groups**: Network access control
  - RDS: Allows PostgreSQL (5432) from ECS tasks
  - Redis: Allows Redis (6379) from ECS tasks
  - ECS: Allows HTTP/HTTPS traffic and internal communication
- **DB Migrator Task**: ECS task definition for database schema migrations
  - Runs Drizzle migrations
  - Triggered manually or via CI/CD
- **Secrets Manager**: Secure storage for database password
- **IAM Roles**: Task execution and task roles for ECS

**Dependencies**:

- Layer 1 (for DB migrator container image)

**Provides to Next Layers**:

- VPC ID and subnet IDs for service deployment
- Database connection details (endpoint, port, credentials)
- Redis connection details
- ECS cluster ARN
- Security group IDs
- IAM role ARNs for ECS tasks

---

### 3. Core Services (`3-core/`)

**Purpose**: Deploys the main application services WITHOUT self-hosted Firecrawl (use hosted Firecrawl or no web scraping).

**Key Resources**:

- **ECS Services**:
  - **API Service**: Main application backend
    - Handles authentication, business logic, AI interactions
    - Desired count: 1 (configurable)
    - Memory: 2048 MB, CPU: 1024 (1 vCPU)
    - Public-facing via ALB
  - **Document Processor**: Asynchronous document processing
    - Handles file uploads, parsing, vectorization
    - Desired count: 1 (configurable)
    - Memory: 4096 MB, CPU: 2048 (2 vCPU)
    - Internal only (Service Discovery)
  - **PDF Exporter**: PDF generation service
    - Uses Playwright for rendering
    - Desired count: 1 (configurable)
    - Memory: 2048 MB, CPU: 1024 (1 vCPU)
    - Public-facing via ALB
- **Application Load Balancer (ALB)**:
  - SSL/TLS certificate via AWS Certificate Manager
  - Target groups for each public service
  - URL routing: `/api/*` → API, `/pdf-exporter/*` → PDF Exporter
  - Health checks for all services
  - HTTPS listener (port 443) with HTTP redirect
- **SQS Queue**: Asynchronous job processing
  - Used for background tasks (document processing, cleanup)
  - Dead letter queue for failed messages
  - Configurable visibility timeout and retention
- **EventBridge Scheduler**: Scheduled jobs
  - Cleanup jobs (old files, expired sessions)
  - Configurable schedules (cron expressions)
- **Service Discovery**: AWS Cloud Map namespace
  - Internal DNS for service-to-service communication
  - Namespace: `local`
- **S3 Bucket (Temporary)**: Short-term file storage
  - Lifecycle policy: Delete objects after 1 day
  - Used for temporary uploads and processing
- **Secrets Manager Secrets**:
  - OAuth credentials (Google, GitHub, GitLab)
  - SSO configuration (optional)
  - Application secrets (auth secret, encryption key)
  - Email service credentials (Resend)
  - Cloudflare R2 credentials (if using R2)
- **IAM Roles and Policies**:
  - Task execution roles (pull images, access secrets)
  - Task roles (access to S3, SQS, other AWS services)
  - GitHub Actions role for CI/CD deployments

**Dependencies**:

- Layer 1 (container images)
- Layer 2 (VPC, database, Redis, ECS cluster)

**Provides to Next Layers**:

- Load balancer DNS name for DNS configuration
- Service ARNs for monitoring
- IAM role ARNs for storage IAM bindings

---

### 4. Core with Firecrawl (`4-core-with-firecrawl/`)

**Purpose**: Alternative to layer 3 that includes self-hosted Firecrawl services for web scraping and crawling.

**Key Resources**:
All resources from layer 3, PLUS:

- **Firecrawl API Service**: Web scraping orchestration
  - Manages crawl jobs and scraping requests
  - Desired count: 1 (configurable)
  - Memory: 2048 MB, CPU: 1024 (1 vCPU)
  - Internal only (Service Discovery)
- **Firecrawl Playwright Service**: Headless browser for rendering
  - Executes JavaScript and renders dynamic content
  - Desired count: 1 (configurable)
  - Memory: 4096 MB, CPU: 2048 (2 vCPU, higher resources for browser)
  - Internal only (Service Discovery)

**Dependencies**:

- Layer 1 (container images including Firecrawl images)
- Layer 2 (VPC, database, Redis, ECS cluster)

**Provides to Next Layers**:

- Same as layer 3
- Internal Firecrawl API endpoint for web scraping

**Important Notes**:

- Deploy EITHER layer 3 OR layer 4, never both

---

### 5. Core with Certificate (`5-core-with-certificate/`)

**Purpose**: Layer to update or add SSL certificates to existing core services.

**Key Resources**:

- **ACM Certificate**: AWS Certificate Manager certificate for custom domain
- **ALB Listener Update**: Updates existing ALB to use new certificate

**Dependencies**:

- Layer 3 or 4 (existing core services)

---

### 6. File Storage - S3 (`6-file-storage/`)

**Purpose**: Provides AWS S3 for permanent file storage (user uploads, generated files).

**Key Resources**:

- **S3 Bucket**:
  - Versioning disabled (single version per object)
  - Server-side encryption (AES-256)
  - CORS configuration for web access
  - Lifecycle rules: Configurable
  - Block public access enabled (private bucket)
- **IAM Policies**:
  - Grants ECS task roles permissions:
    - `s3:GetObject`: Read access
    - `s3:PutObject`: Write access
    - `s3:DeleteObject`: Delete access
    - `s3:ListBucket`: List objects

**Dependencies**:

- Layer 3 or 4 (for IAM role references)

**Provides to Applications**:

- Bucket name and ARN for file operations
- Integrated IAM permissions (no additional auth needed)

---

### 7. File Storage - Cloudflare R2 (`7-cloudflare-storage/`)

**Purpose**: Alternative to layer 6 using Cloudflare R2 for cost-effective file storage with zero egress fees.

**Key Resources**:

- **Cloudflare R2 Bucket**:
  - S3-compatible API
  - Zero egress fees (unlimited downloads)
  - Location: Auto or specific region
  - Lifecycle rules: Configurable

**Dependencies**:

- Layer 3 or 4 (for environment variable updates)
- Cloudflare account with R2 enabled

**Provides to Applications**:

- R2 bucket name and endpoint
- S3-compatible credentials via environment variables

**Important Notes**:

- Deploy EITHER layer 6 OR layer 7, never both
- Requires Cloudflare account and R2 API token
- Must update layer 3/4 `providers.tf` to reference correct core layer

## Getting Started

For complete deployment instructions, see **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)**.

### Prerequisites

- AWS Account with appropriate permissions
- `aws` CLI, Terraform >= 1.0, and Docker installed
- Domain name for SSL certificate (optional but recommended)

### Deployment Overview

1. **Deploy Container Registry** (`1-repository/`)
2. **Build and Push Docker Images** (using `scripts/build_and_push_images.sh`)
3. **Deploy Database & Networking** (`2-db-storage/`)
4. **Run Database Migrations** (via ECS task or GitHub Actions)
5. **Deploy Core Services** (`3-core/` OR `4-core-with-firecrawl/`)
6. **Configure & Deploy Frontend** (via GitHub Actions)
7. **Configure DNS** (point domain to ALB DNS name)
8. **Deploy File Storage** (`6-file-storage/` OR `7-cloudflare-storage/`)

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed step-by-step instructions.

## Deployment Order

**Critical**: Layers must be deployed sequentially:

1. `1-repository` → Build & push images
2. `2-db-storage` → Run migrations
3. `3-core` OR `4-core-with-firecrawl` → Configure Frontend & DNS
4. `5-core-with-certificate` (optional)
5. `6-file-storage` OR `7-cloudflare-storage`

## State Management

- **Development**: Uses local Terraform state (`terraform.tfstate` files)
- **Production**: Use S3 backend (see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for setup)

### Remote State Management

For production environments, it's recommended to use S3 remote state management with DynamoDB for state locking. Each layer's `providers.tf` file contains commented-out blocks for both the S3 backend configuration and remote state data sources. To enable remote state:

1. Create an S3 bucket for storing Terraform state (e.g., `your-project-terraform-state`)
2. Create a DynamoDB table for state locking (e.g., `terraform-state-lock`)
3. In each layer's `providers.tf`, uncomment the `backend "s3"` block and update the bucket name
4. Comment out the local `terraform_remote_state` data source blocks
5. Uncomment the S3 `terraform_remote_state` data source blocks and update the bucket name
6. Run `terraform init -migrate-state` in each layer to migrate existing state to S3

## Cost Estimates

Approximate monthly costs for a small production deployment (based on 2024 AWS pricing in US East region):

### Layer-by-Layer Breakdown

| Layer                   | Resources                          | Approximate Monthly Cost |
| ----------------------- | ---------------------------------- | ------------------------ |
| 1-repository            | ECR (10GB storage)                 | $1                       |
| 2-db-storage            | VPC, RDS, ElastiCache, NAT Gateway | $85-95                   |
| 3-core                  | ECS Fargate, ALB, SQS              | $55-75                   |
| 4-core (with Firecrawl) | +Firecrawl services                | +$35-45                  |
| 6-file-storage          | S3 (variable usage)                | $2-5                     |
| 7-cloudflare-storage    | R2 (variable usage)                | $1.50                    |
| **Total (3-core + S3)** |                                    | **$143-176/month**       |
| **Total (4-core + S3)** |                                    | **$178-221/month**       |

### Detailed Cost Breakdown

#### Layer 2: Database & Storage ($85-95/month)

- **NAT Gateways (2)**: ~$66/month ($0.045/hour × 730 hours × 2 AZs)
- **RDS PostgreSQL (db.t3.micro)**: ~$12/month ($0.017/hour × 730 hours)
  - 20GB gp3 storage: ~$2.30/month
- **ElastiCache Redis (cache.t3.micro)**: ~$10/month ($0.0136/hour × 730 hours)
- **VPC, Subnets, IGW**: Free

#### Layer 3: Core Services ($55-75/month)

- **Application Load Balancer**: ~$17-20/month
  - Base: $16.50 ($0.0225/hour × 730 hours)
  - LCU charges: ~$0.50-3.50 (varies with traffic)
- **ECS Fargate Tasks (ARM64)**:
  - **API** (512 CPU / 1024 MB)
  - **Document Processor** (2048 CPU / 2048 MB)
  - **PDF Exporter** (512 CPU / 1024 MB)
- **SQS, EventBridge, CloudWatch Logs**: ~$1-5/month (usage-based)
- **Secrets Manager**: ~$2-3/month (~5-6 secrets × $0.40/secret/month)

#### Layer 4: Firecrawl Services (Additional $35-45/month)

- **Firecrawl API** (1024 CPU / 2048 MB)
- **Firecrawl Playwright** (1024 CPU / 2048 MB)
- **Total for both**: ~$58/month

#### Layer 6: S3 File Storage ($2-5/month)

- **S3 Standard Storage**: $0.023/GB/month
- **S3 Requests**: Minimal for typical usage
- **Data Transfer**: First 100GB/month free, then $0.09/GB

#### Layer 7: Cloudflare R2 ($1.50/month)

- **Storage**: $0.015/GB/month (10GB included free)
- **Class A Operations**: $4.50 per million
- **Class B Operations**: $0.36 per million
- **Egress**: Free (major cost advantage over S3)

### Important Notes

1. **NAT Gateway is the highest cost** (~$66/month for 2 gateways). Consider alternatives:
   - Use a single NAT Gateway (reduces HA but saves ~$33/month)
   - Use NAT instances (more complex but cheaper for low traffic)
   - Deploy services in public subnets where appropriate

2. **Data transfer costs** are not included and can vary significantly based on:
   - Traffic volume
   - Cross-AZ data transfer ($0.01/GB)
   - Internet egress beyond free tier

3. **Actual costs may vary** based on:
   - AWS region (prices shown are for US East)
   - Actual resource utilization
   - Traffic patterns and data transfer
   - Number of secrets stored
   - CloudWatch Logs volume

4. **Free Tier eligible** (first 12 months for new AWS accounts):
   - 750 hours/month of db.t3.micro RDS
   - 750 hours/month of cache.t3.micro ElastiCache
   - 750 hours/month of ALB
   - This can reduce costs by ~$40-50/month in the first year

## Monitoring & Operations

All services provide structured logging via AWS CloudWatch Logs. Access logs through:

- **AWS Console**: CloudWatch Logs
- **CLI**: `aws logs tail` (see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md))

## Cleanup

To destroy infrastructure, run `terraform destroy` in **reverse order** (storage → core → database → registry). See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed cleanup instructions.

**Warning**: This permanently deletes all data. Ensure you have backups.

## Additional Documentation

- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Step-by-step deployment instructions
- Layer-specific READMEs in each folder
