# Layer 3: Core Services (Without Firecrawl)

This layer deploys the core application services using Cloud Run, without Firecrawl integration.

## Resources Created

- **Cloud Run Services**: API, Document Processor, PDF Exporter
- **Global Load Balancer**: HTTPS load balancer with SSL certificate
- **Cloud Tasks Queue**: For asynchronous document processing
- **Cloud Scheduler**: Daily cleanup job for temporary files
- **Cloud Storage**: Temporary file storage (1-day retention)
- **Secret Manager**: OAuth credentials, auth secrets, encryption keys

## Prerequisites

- Layer 1 (1-repository) deployed with images pushed
- Layer 2 (2-db-storage) deployed with migrations run
- Domain name configured and ready for DNS updates

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
domain       = "api.example.com"

# Add OAuth credentials, secrets, etc.
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

## Post-Deployment DNS Configuration

After deployment, configure your DNS:

```bash
# Get the load balancer IP
terraform output load_balancer_ip

# Add an A record to your DNS provider:
# Type: A
# Name: api (or your subdomain)
# Value: <LOAD_BALANCER_IP>
```

Wait 5-10 minutes for:

- DNS propagation
- SSL certificate provisioning (automatic via Google-managed certificate)

## Service Architecture

### API Service

- **Port**: 3000
- **Ingress**: Public (via Load Balancer)
- **Scaling**: Min 1, Max 10 instances
- **Features**: Authentication, business logic, API endpoints

### Document Processor

- **Port**: 5000
- **Ingress**: Internal only (via Cloud Tasks)
- **Scaling**: Min 0, Max 5 instances (scales to zero when idle)
- **Features**: Document parsing, OCR, text extraction

### PDF Exporter

- **Port**: 8000
- **Ingress**: Internal only
- **Scaling**: Min 0, Max 5 instances (scales to zero when idle)
- **Features**: PDF generation and export

## Environment Variables

Each service receives:

- Database connection URL
- Redis connection URL
- Storage bucket names
- Service discovery endpoints
- OAuth credentials (from Secret Manager)
- Feature flags (`USE_FIRECRAWL=false`)

## Monitoring & Logs

View logs for each service:

```bash
# API logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=${PROJECT_NAME}-api" --limit 50

# Document Processor logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=${PROJECT_NAME}-document-processor" --limit 50

# PDF Exporter logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=${PROJECT_NAME}-pdf-exporter" --limit 50
```

## Testing the Deployment

```bash
# Test API health endpoint
curl https://api.example.com/api/health

# Should return: {"status":"ok"}
```

## Scaling Configuration

Adjust scaling in `terraform.tfvars`:

```hcl
# For higher traffic
api_min_instances = 2
api_max_instances = 20

# For cost optimization (dev/staging)
api_min_instances = 0  # Scale to zero when idle
document_processor_min_instances = 0
pdf_exporter_min_instances = 0
```

## Security Features

- All secrets stored in Secret Manager
- Internal services only accessible via VPC
- Cloud Tasks authentication for service-to-service calls
- HTTPS-only via Load Balancer
- Automatic SSL certificate management

## Next Steps

After this layer is deployed, proceed to:

- **Layer 5**: `5-file-storage` for permanent Cloud Storage
- **Layer 6**: `6-cloudflare-storage` for Cloudflare R2 storage

Or alternatively, deploy:

- **Layer 4**: `4-core-with-firecrawl` if you need Firecrawl integration

## Cost Estimate

Monthly costs (approximate):

| Resource                           | Configuration                | Cost              |
| ---------------------------------- | ---------------------------- | ----------------- |
| Cloud Run (API, 1 min instance)    | Always-on                    | $15-25            |
| Cloud Run (Processors, scale to 0) | Per-request                  | $5-15             |
| Load Balancer                      | Forwarding rules + bandwidth | $20-30            |
| Cloud Tasks                        | 1M tasks free, then $0.40/M  | $0-5              |
| Cloud Scheduler                    | 3 jobs free, then $0.10/job  | $0                |
| Cloud Storage (Temporary)          | <10GB with 1-day lifecycle   | $0-1              |
| **Total**                          |                              | **~$40-76/month** |

Additional costs scale with:

- Request volume (Cloud Run CPU time)
- Document processing (more processor instances)
- Egress bandwidth
