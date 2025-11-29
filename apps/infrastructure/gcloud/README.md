# Google Cloud Infrastructure

This directory contains the Terraform configuration for deploying the application infrastructure on Google Cloud Platform (GCP).

## Architecture Overview

The infrastructure is organized into **6 sequential layers**, each building upon the previous one using Terraform remote state management:

```
1-repository          → Artifact Registry
↓
2-db-storage          → VPC + Cloud SQL + Redis + Cloud Run Setup
↓
3-core                → Cloud Run Services (without Firecrawl)
  OR
4-core-with-firecrawl → Cloud Run Services (with Firecrawl)
↓
5-file-storage        → Cloud Storage
  OR
6-cloudflare-storage  → Cloudflare R2
```

## Layer Details

### 1. Container Registry (`1-repository/`)

**Purpose**: Provides a private Docker registry for storing application container images.

**Key Resources**:

- **Artifact Registry Repository**: Docker format registry with automatic cleanup
  - Retention policy: Keeps last 5 tagged images per image name
  - Location: Configurable
  - Format: Docker

**Dependencies**: None

**Provides to Next Layers**:

- Registry URL for pushing/pulling images
- Image paths for all application services

---

### 2. Database & Storage (`2-db-storage/`)

**Purpose**: Establishes the foundational networking and data infrastructure for all application services.

**Key Resources**:

- **VPC Network**: Private network with custom subnet (10.0.0.0/24)
  - VPC Access Connector: Enables Cloud Run to access private resources
  - Cloud NAT: Provides outbound internet access for private services
  - Firewall rules: Controlled ingress/egress
- **Cloud SQL PostgreSQL 18**: Managed relational database
  - Private IP only (no public exposure)
  - Configurable tier
  - Automatic backups and point-in-time recovery
  - High availability option available
- **Cloud Memorystore Redis 7**: Managed in-memory cache
  - Private IP only
  - Configurable tier
  - Used for session storage and caching
- **Service Account**: Cloud Run service identity with minimal required permissions
  - `cloudsql.client`: Database access
  - `redis.editor`: Redis access
  - `secretmanager.secretAccessor`: Secret access
- **DB Migrator Job**: Cloud Run Job for database schema migrations
  - Runs Drizzle migrations
  - Triggered manually or via CI/CD
- **Secret Manager**: Secure storage for database password

**Dependencies**:

- Layer 1

**Provides to Next Layers**:

- VPC network and connector for private service communication
- Database connection details
- Redis connection details
- CI/CD service account

---

### 3. Core Services (`3-core/`)

**Purpose**: Deploys the main application services WITHOUT self-hosted Firecrawl (use hosted Firecrawl or no web scraping).

**Key Resources**:

- **Cloud Run Services**:
  - **API Service**: Main application backend
    - Handles authentication, business logic, AI interactions
    - Min instances: 0, Max: 5
    - Memory: 512MB, CPU: 1
  - **Document Processor**: Asynchronous document processing
    - Handles file uploads, parsing, vectorization
    - Min instances: 0, Max: 5
    - Memory: 2GB, CPU: 4
  - **PDF Exporter**: PDF generation service
    - Uses Playwright for rendering
    - Min instances: 0, Max: 5
    - Memory: 512MB, CPU: 1
- **Global HTTPS Load Balancer**:
  - SSL certificate (auto-provisioned via Google-managed certificates)
  - Backend services for each Cloud Run service
  - URL routing: `/api/*` → API, `/pdf-exporter/*` → PDF Exporter
  - Static IP address
- **Cloud Tasks Queue**: Asynchronous job processing
  - Used for background tasks (document processing, cleanup)
  - Configurable rate limits and retry policies
- **Cloud Scheduler**: Scheduled jobs
  - Cleanup jobs (old files, expired sessions)
  - Configurable schedules
- **Secret Manager Secrets**:
  - OAuth credentials (Google, GitHub, GitLab)
  - SSO configuration (optional)
  - Application secrets (auth secret, encryption key)
  - Email service credentials (Resend)
  - Cloudflare R2 credentials (if using R2)

**Dependencies**:

- Layer 1 (container images)
- Layer 2 (VPC, database, Redis, service account)

**Provides to Next Layers**:

- Load balancer IP for DNS configuration
- Service URLs for health checks
- Cloud Run service accounts

---

### 4. Core with Firecrawl (`4-core-with-firecrawl/`)

**Purpose**: Alternative to layer 3 that includes self-hosted Firecrawl services for web scraping and crawling.

**Key Resources**:
All resources from layer 3, PLUS:

- **Firecrawl API Service**: Web scraping orchestration
  - Manages crawl jobs and scraping requests
  - Min instances: 0, Max: 5
  - Memory: 2GB, CPU: 1
- **Firecrawl Playwright Service**: Headless browser for rendering
  - Executes JavaScript and renders dynamic content
  - Min instances: 0, Max: 5
  - Memory: 2GB, CPU: 2

**Dependencies**:

- Layer 1 (container images including Firecrawl images)
- Layer 2 (VPC with larger connector for additional services)

**Provides to Next Layers**:

- Same as layer 3
- Internal Firecrawl API endpoint for web scraping

**Important Notes**:

- Deploy EITHER layer 3 OR layer 4, never both
- Requires `use_firecrawl=true` in layer 2 for db migration

---

### 5. File Storage - Cloud Storage (`5-file-storage/`)

**Purpose**: Provides Google Cloud Storage for file storage (user uploads).

**Key Resources**:

- **Cloud Storage Bucket**:
  - Versioning disabled
  - Location: Same as other resources
  - Storage class: STANDARD
  - Uniform bucket-level access
- **IAM Bindings**:
  - Grants Cloud Run service account permissions:
    - `roles/storage.objectAdmin`

**Dependencies**:

- Layer 3 or 4 (for service account reference)

---

### 6. File Storage - Cloudflare R2 (`6-cloudflare-storage/`)

**Purpose**: Alternative to layer 5 using Cloudflare R2 for cost-effective file storage with zero egress fees.

**Key Resources**:

- **Cloudflare R2 Bucket**:
  - S3-compatible API
  - Zero egress fees (unlimited downloads)
  - Location: Auto or specific region
  - Lifecycle rules: Configurable
- **Secret Manager Secrets**:
  - R2 access key ID
  - R2 secret access key
  - R2 endpoint URL

**Dependencies**:

- Layer 3 or 4 (for Cloud Run service updates)
- Cloudflare account with R2 enabled

**Important Notes**:

- Deploy EITHER layer 5 OR layer 6, never both
- Requires Cloudflare account and R2 API token

## Getting Started

For complete deployment instructions, see **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)**.

### Prerequisites

- Google Cloud Project with billing enabled
- `gcloud` CLI, Terraform >= 1.0, and Docker installed
- Domain name for SSL certificate

### Deployment Overview

1. **Deploy Container Registry** (`1-repository/`)
2. **Build and Push Docker Images** (using `scripts/build_and_push_images.sh`)
3. **Deploy Database and Networking** (`2-db-storage/`)
4. **Run Database Migrations** (via GitHub Actions)
5. **Deploy Core Services** (`3-core/` OR `4-core-with-firecrawl/`)
6. **Configure and Deploy Frontend** (via GitHub Actions)
7. **Configure DNS** (point domain to load balancer IP)
8. **Deploy File Storage** (`5-file-storage/` OR `6-cloudflare-storage/`)

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed step-by-step instructions.

## Deployment Order

**Critical**: Layers must be deployed sequentially:

1. `1-repository` → Build & push images
2. `2-db-storage` → Run migrations
3. `3-core` OR `4-core-with-firecrawl` → Configure Frontend & DNS
4. `5-file-storage` OR `6-cloudflare-storage`

## State Management

- **Development**: Uses local Terraform state (`terraform.tfstate` files)
- **Production**: Use Cloud Storage backend (see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for setup)

## Cost Estimates

Approximate monthly costs for a small production deployment:

| Layer                        | Resources                       | Approximate Monthly Cost |
| ---------------------------- | ------------------------------- | ------------------------ |
| 1-repository                 | Artifact Registry (10GB)        | $1-2                     |
| 2-db-storage                 | VPC, Cloud SQL, Redis, NAT      | $100                     |
| 3-core                       | Cloud Run, Load Balancer, Tasks | $40                      |
| 4-core (with Firecrawl)      | +Firecrawl services             | +$20                     |
| 5-file-storage               | Cloud Storage (100GB)           | $2-3                     |
| 6-cloudflare-storage         | R2 (100GB)                      | $1.50                    |
| **Total (3-core + Storage)** |                                 | **$145/month**           |
| **Total (4-core + Storage)** |                                 | **$165/month**           |

**Cost Optimization Tips:**

- Use `db-f1-micro` and `BASIC` Redis tier for dev/staging
- Set min_instances=0 for non-critical services (scale to zero)
- Choose Cloudflare R2 if you have high download volume
- Use committed use discounts for production workloads

## Monitoring & Operations

All services provide structured logging via Google Cloud Logging. Access logs through:

- **Cloud Console**: Logs Explorer
- **CLI**: `gcloud logging read` (see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md))

## Cleanup

To destroy infrastructure, run `terraform destroy` in **reverse order** (storage → core → database → registry). See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed cleanup instructions.

**Warning**: This permanently deletes all data. Ensure you have backups.
