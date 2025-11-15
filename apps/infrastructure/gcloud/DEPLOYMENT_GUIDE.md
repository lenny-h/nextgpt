# Google Cloud Infrastructure Deployment Guide

Complete step-by-step guide for deploying your application on Google Cloud Platform.

## Prerequisites

### Required Tools

- **gcloud CLI**: [Install Guide](https://cloud.google.com/sdk/docs/install)
- **Terraform**: >= 1.0 [Download](https://www.terraform.io/downloads)
- **Docker**: [Install Guide](https://docs.docker.com/get-docker/)
- **Git**: For cloning the repository

### Google Cloud Setup

1. **Create a GCP Project**:

```bash
gcloud projects create your-project-id --name="Your Project Name"
gcloud config set project your-project-id
```

2. **Enable Required APIs**:

```bash
gcloud services enable \
  compute.googleapis.com \
  run.googleapis.com \
  sql-component.googleapis.com \
  sqladmin.googleapis.com \
  redis.googleapis.com \
  artifactregistry.googleapis.com \
  cloudtasks.googleapis.com \
  cloudscheduler.googleapis.com \
  secretmanager.googleapis.com \
  servicenetworking.googleapis.com \
  vpcaccess.googleapis.com
```

3. **Link Billing Account**:

```bash
gcloud billing accounts list
gcloud billing projects link your-project-id --billing-account=BILLING_ACCOUNT_ID
```

4. **Set Default Region**:

```bash
gcloud config set compute/region us-central1
```

## Step-by-Step Deployment

### Step 1: Deploy Artifact Registry

```bash
cd apps/infrastructure/gcloud/1-repository

# Configure Terraform variables
cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars:
nano terraform.tfvars
```

Required variables:

```hcl
project_id   = "your-project-id"
region       = "us-central1"
project_name = "myapp"
environment  = "production"
```

Deploy:

```bash
terraform init
terraform plan
terraform apply
```

### Step 2: Build and Push Docker Images

```bash
cd ../scripts

# Get your configuration
PROJECT_ID=$(gcloud config get-value project)
REGION="us-central1"
PROJECT_NAME="myapp"

# Build and push all images
bash build_and_push_images.sh $PROJECT_ID $REGION $PROJECT_NAME

# If NOT using Firecrawl:
bash build_and_push_images.sh $PROJECT_ID $REGION $PROJECT_NAME --skip-firecrawl
```

Verify images were pushed:

```bash
gcloud artifacts docker images list \
  $REGION-docker.pkg.dev/$PROJECT_ID/$PROJECT_NAME-docker
```

### Step 3: Deploy Database & Networking

```bash
cd ../2-db-storage

cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars
```

Key configuration options:

```hcl
project_id   = "your-project-id"
region       = "us-central1"
project_name = "myapp"

# Database tier (f1-micro for dev, n1-standard-1+ for prod)
db_tier      = "db-f1-micro"
db_disk_size = 10

# Redis tier (BASIC for dev, STANDARD_HA for prod)
redis_tier           = "BASIC"
redis_memory_size_gb = 1
```

Deploy:

```bash
terraform init
terraform plan
terraform apply
```

**Wait for deployment** (5-10 minutes for Cloud SQL and Redis provisioning).

### Step 4: Run Database Migrations

```bash
# Get the job name
JOB_NAME=$(terraform output -raw db_migrator_job_name)
REGION=$(terraform output -raw region)

# Execute migrations
gcloud run jobs execute $JOB_NAME \
  --region $REGION \
  --wait

# Check job execution logs
gcloud logging read "resource.type=cloud_run_job AND resource.labels.job_name=$JOB_NAME" --limit 50
```

### Step 5: Deploy Core Services

**Choose ONE option:**

#### Option A: Without Firecrawl

```bash
cd ../3-core

cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars
```

Critical variables:

```hcl
project_id   = "your-project-id"
domain       = "api.yourdomain.com"

# OAuth credentials (from Google/GitHub OAuth apps)
google_client_id     = "your-google-client-id"
google_client_secret = "your-google-client-secret"
github_client_id     = "your-github-client-id"
github_client_secret = "your-github-client-secret"

# Generate secure random strings (32+ chars)
nextauth_secret = "your-nextauth-secret"
nextauth_url    = "https://api.yourdomain.com"
encryption_key  = "your-encryption-key"
```

#### Option B: With Firecrawl

```bash
cd ../4-core-with-firecrawl

cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars
```

Additional Firecrawl variables:

```hcl
# All variables from Option A, plus:
use_firecrawl     = true
firecrawl_api_key = "your-firecrawl-api-key"
```

Deploy selected option:

```bash
terraform init
terraform plan
terraform apply
```

**Wait for deployment** (5-10 minutes for Cloud Run services and Load Balancer).

### Step 6: Configure DNS

```bash
# Get the Load Balancer IP
LB_IP=$(terraform output -raw load_balancer_ip)
echo "Load Balancer IP: $LB_IP"
```

**Add DNS Record** to your domain provider:

- **Type**: A
- **Name**: api (or your subdomain)
- **Value**: `<LB_IP>`
- **TTL**: 300 (or auto)

**Wait for DNS propagation** (5-30 minutes):

```bash
# Check DNS propagation
dig api.yourdomain.com

# Wait for SSL certificate provisioning
gcloud compute ssl-certificates list
```

The SSL certificate status will change from `PROVISIONING` → `ACTIVE` once DNS is verified.

### Step 7: Verify Core Services

```bash
# Check Cloud Run services
gcloud run services list --region us-central1

# Test API health endpoint
curl https://api.yourdomain.com/api/health

# Should return: {"status":"ok"}
```

View service logs:

```bash
# API logs
gcloud run services logs read myapp-api --region us-central1 --limit 50

# Document Processor logs
gcloud run services logs read myapp-document-processor --region us-central1 --limit 20
```

### Step 8: Deploy File Storage

**Choose ONE option:**

#### Option A: Cloud Storage

```bash
cd ../5-file-storage

cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars
```

**IMPORTANT**: Update `providers.tf` if you deployed 4-core-with-firecrawl:

```hcl
data "terraform_remote_state" "core" {
  backend = "local"
  config = {
    path = "../4-core-with-firecrawl/terraform.tfstate"  # Update this
  }
}
```

Deploy:

```bash
terraform init
terraform plan
terraform apply
```

#### Option B: Cloudflare R2

First, get R2 credentials from Cloudflare:

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to R2 → Overview
3. Click "Manage R2 API Tokens"
4. Create token with R2 permissions
5. Note Account ID, Access Key, and Secret Key

```bash
cd ../6-cloudflare-storage

cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars
```

Add Cloudflare credentials:

```hcl
cloudflare_api_token  = "your-cloudflare-api-token"
cloudflare_account_id = "your-account-id"
r2_access_key_id      = "your-r2-access-key"
r2_secret_access_key  = "your-r2-secret-key"
```

**IMPORTANT**: Update `providers.tf` if you deployed 4-core-with-firecrawl (same as Option A).

Deploy:

```bash
terraform init
terraform plan
terraform apply
```

### Step 9: Update Services with Storage Configuration

For Cloud Storage:

```bash
BUCKET_NAME=$(terraform output -raw permanent_storage_bucket_name)

gcloud run services update myapp-api \
  --update-env-vars PERMANENT_STORAGE_BUCKET=$BUCKET_NAME \
  --region us-central1
```

For Cloudflare R2:

```bash
BUCKET_NAME=$(terraform output -raw r2_bucket_name)
R2_ENDPOINT=$(terraform output -raw r2_endpoint)

gcloud run services update myapp-api \
  --update-env-vars PERMANENT_STORAGE_BUCKET=$BUCKET_NAME,STORAGE_ENDPOINT=$R2_ENDPOINT,STORAGE_TYPE=r2 \
  --region us-central1
```

## Post-Deployment

### Verify Everything Works

```bash
# 1. Check all Cloud Run services are running
gcloud run services list --region us-central1

# 2. Test API
curl https://api.yourdomain.com/api/health

# 3. Check database connectivity
gcloud sql instances describe myapp-postgres

# 4. Verify Redis
gcloud redis instances describe myapp-redis --region us-central1

# 5. Test file upload (if applicable)
# Use your application's file upload endpoint
```

### Set Up Monitoring

```bash
# Create uptime check for API
gcloud monitoring uptime create \
  --display-name="API Health Check" \
  --http-check=https://api.yourdomain.com/api/health \
  --monitored-resource=uptime-url

# View metrics
gcloud monitoring dashboards list
```

### Configure Alerts

```bash
# Create alert policy for high error rate
gcloud alpha monitoring policies create \
  --notification-channels=YOUR_CHANNEL_ID \
  --display-name="High Error Rate" \
  --condition-display-name="Cloud Run Error Rate > 5%" \
  --condition-threshold-value=5 \
  --condition-threshold-duration=60s
```

## Production Optimization

### 1. Enable Cloud Storage Backend for Terraform State

```bash
# Create state bucket
gsutil mb -l us-central1 gs://your-project-terraform-state
gsutil versioning set on gs://your-project-terraform-state

# Enable object versioning
gsutil lifecycle set - gs://your-project-terraform-state <<EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {"numNewerVersions": 5}
      }
    ]
  }
}
EOF
```

In each layer's `providers.tf`, uncomment and configure:

```hcl
backend "gcs" {
  bucket = "your-project-terraform-state"
  prefix = "terraform/state/<layer-name>"
}
```

Then migrate state:

```bash
cd each-layer
terraform init -migrate-state
```

### 2. Scale for Production

Update `terraform.tfvars` in core layer:

```hcl
# Higher availability
api_min_instances = 2
api_max_instances = 20

# Larger database
db_tier = "db-n1-standard-1"  # 3.75GB RAM, ~$70/month

# High availability Redis
redis_tier = "STANDARD_HA"  # ~$75/month for 1GB
```

### 3. Enable Cloud CDN (Optional)

For static assets:

```bash
gcloud compute backend-services update myapp-api-backend \
  --enable-cdn \
  --global
```

### 4. Set Up Backup Strategy

```bash
# Cloud SQL automatic backups are enabled by default
# Verify backup configuration
gcloud sql instances describe myapp-postgres | grep backupConfiguration -A 10

# Create on-demand backup
gcloud sql backups create \
  --instance=myapp-postgres \
  --description="Pre-deployment backup"
```

## Updating the Infrastructure

### Update Docker Images

```bash
cd apps/infrastructure/gcloud/scripts
bash build_and_push_images.sh $PROJECT_ID $REGION $PROJECT_NAME

# Force new deployment
gcloud run services update myapp-api \
  --region us-central1
```

### Update Terraform Configuration

```bash
cd desired-layer
# Edit terraform.tfvars or .tf files
terraform plan
terraform apply
```

### Update Environment Variables

```bash
gcloud run services update myapp-api \
  --update-env-vars NEW_VAR=value \
  --region us-central1
```

## Troubleshooting

### Issue: Cloud Run Service Won't Start

**Check logs**:

```bash
gcloud run services logs read myapp-api --region us-central1 --limit 100
```

**Common causes**:

- Database connection issues (check VPC connector)
- Missing secrets (verify Secret Manager permissions)
- Image pull errors (check Artifact Registry access)

### Issue: Database Connection Timeout

**Verify VPC Access Connector**:

```bash
gcloud compute networks vpc-access connectors describe \
  myapp-vpc-connector --region us-central1
```

**Check Cloud SQL connectivity**:

```bash
# From Cloud Shell
gcloud sql connect myapp-postgres --user=myapp-user
```

### Issue: SSL Certificate Not Provisioning

**Check certificate status**:

```bash
gcloud compute ssl-certificates describe myapp-lb-cert
```

**Verify DNS**:

```bash
dig api.yourdomain.com
```

If DNS is correct, wait 10-30 minutes for certificate provisioning.

### Issue: High Costs

**Analyze costs**:

```bash
# View current month's costs
gcloud billing accounts describe YOUR_BILLING_ACCOUNT
```

**Cost-saving tips**:

- Set `min_instances=0` for non-critical services
- Use `db-f1-micro` for dev/staging
- Implement lifecycle policies on storage
- Review and delete unused resources

## Cleanup

To destroy all infrastructure:

```bash
# Step 1: Storage layer
cd 6-cloudflare-storage  # or 5-file-storage
terraform destroy

# Step 2: Core services
cd ../4-core-with-firecrawl  # or 3-core
terraform destroy

# Step 3: Database & networking
cd ../2-db-storage
terraform destroy

# Step 4: Artifact Registry
cd ../1-repository
terraform destroy
```

**Warning**: This will delete all data! Ensure you have backups.

## Next Steps

- Set up CI/CD with GitHub Actions or Cloud Build
- Configure custom domains and DNS
- Implement monitoring and alerting
- Set up disaster recovery procedures
- Review security best practices

## Support

- [Google Cloud Documentation](https://cloud.google.com/docs)
- [Terraform GCP Provider](https://registry.terraform.io/providers/hashicorp/google/latest/docs)
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
