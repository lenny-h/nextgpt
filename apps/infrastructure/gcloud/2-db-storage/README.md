# Layer 2: Database & Storage

This layer sets up the core infrastructure including VPC, databases, and networking.

## Resources Created

- **VPC Network**: Private network for all resources
- **VPC Subnet**: Private subnet with Google API access
- **VPC Access Connector**: Connects Cloud Run to VPC resources
- **Cloud Router & NAT**: Outbound internet access from private resources
- **Cloud SQL PostgreSQL 16**: Managed PostgreSQL database
- **Cloud Memorystore Redis 7**: Managed Redis cache
- **Service Account**: For Cloud Run services with appropriate permissions
- **Secret Manager**: Stores database credentials
- **DB Migrator Job**: Cloud Run Job for running database migrations

## Prerequisites

- Layer 1 (1-repository) must be deployed
- Docker images must be pushed to Artifact Registry

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

db_tier              = "db-f1-micro"
db_disk_size         = 10
redis_tier           = "BASIC"
redis_memory_size_gb = 1
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

## Running Database Migrations

After deployment, run the DB migrator job:

```bash
# Get the job name
JOB_NAME=$(terraform output -raw db_migrator_job_name)
REGION=$(terraform output -raw region)

# Execute the job
gcloud run jobs execute $JOB_NAME --region $REGION
```

## Network Architecture

- **VPC**: Custom VPC with private subnet
- **VPC Access Connector**: Allows Cloud Run to reach VPC resources (Cloud SQL, Redis)
- **Cloud NAT**: Provides outbound internet access for Cloud Run services
- **Private Service Access**: Cloud SQL uses private IP within VPC

## Security Features

- Cloud SQL only accessible via private IP
- Redis only accessible within VPC
- Service account with least-privilege IAM roles
- Database credentials stored in Secret Manager
- Automatic backups enabled (7 days retention)

## High Availability Options

### Database (REGIONAL mode)

```hcl
db_tier = "db-n1-standard-1"  # Or higher tier
```

This enables:

- Multi-zone deployment
- Automatic failover
- Higher SLA

### Redis (STANDARD_HA tier)

```hcl
redis_tier = "STANDARD_HA"
```

This enables:

- Read replica
- Automatic failover
- 99.9% uptime SLA

## Outputs

Important outputs for next layers:

- `vpc_connector_id`: Used by Cloud Run services
- `database_url`: PostgreSQL connection string
- `redis_url`: Redis connection URL
- `cloud_run_service_account_email`: Service account for Cloud Run

## Next Steps

After this layer is deployed and migrations are run, proceed to:

- **Layer 3**: `3-core` for Cloud Run services (without Firecrawl)
- **Layer 4**: `4-core-with-firecrawl` for Cloud Run services (with Firecrawl)

## Cost Estimate

Monthly costs (approximate):

| Resource                     | Configuration        | Cost                |
| ---------------------------- | -------------------- | ------------------- |
| Cloud SQL (db-f1-micro)      | 0.6GB RAM, Zonal     | $7-10               |
| Cloud SQL (db-n1-standard-1) | 3.75GB RAM, Regional | $70-90              |
| Redis (BASIC, 1GB)           | 1GB memory           | $35-45              |
| Redis (STANDARD_HA, 1GB)     | 1GB with HA          | $75-90              |
| VPC Access Connector         | Min 2 instances      | $15-20              |
| Cloud NAT                    | Data processing      | $45-60              |
| **Total (Basic)**            |                      | **~$102-135/month** |
| **Total (HA)**               |                      | **~$205-260/month** |

Cost optimization tips:

- Use db-f1-micro and BASIC Redis for dev/staging
- Enable disk autoresize to avoid over-provisioning
- Use committed use discounts for production
