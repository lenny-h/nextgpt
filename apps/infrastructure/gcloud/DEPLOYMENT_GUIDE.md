# Google Cloud Infrastructure Deployment Guide

Complete step-by-step guide for deploying your application on Google Cloud Platform.

## Prerequisites

### Required Tools

- **gcloud CLI**: [Install Guide](https://cloud.google.com/sdk/docs/install)
- **Terraform**: >= 1.0 [Download](https://www.terraform.io/downloads)
- **Docker**: [Install Guide](https://docs.docker.com/get-docker/)
- **Git**: For cloning the repository
- **GitHub**: For running github actions
- **Cloudflare Account**: If using Cloudflare R2 for storage

### Google Cloud Setup (this can also be done in the GCP Console)

1. **Create a GCP Project**:

```bash
gcloud projects create your-project-id --name="Your Project Name"
gcloud config set project your-project-id
```

2. **Link Billing Account**:

```bash
gcloud billing accounts list
gcloud billing projects link your-project-id --billing-account=BILLING_ACCOUNT_ID
```

3. **Set Default Region**:

```bash
gcloud config set compute/region us-central1
```

## Step-by-Step Deployment

### Step 1: Deploy Artifact Registry

```bash
cd apps/infrastructure/gcloud/1-repository

# Configure Terraform variables
cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars
# e.g. using nano: nano terraform.tfvars
```

Required variables:

```hcl
google_vertex_project  = "your-gcp-project-id"
google_vertex_location = "us-central1"
```

Deploy:

```bash
terraform init
terraform plan
terraform apply
```

### Step 2: Build and Push Docker Images

#### Building Firecrawl Images

If you're using Firecrawl (not skipping with `--skip-firecrawl`), you must first build the Firecrawl images locally before running the script. The images must be built for `linux/amd64` platform:

```bash
# Clone Firecrawl repository
git clone https://github.com/mendableai/firecrawl.git
cd firecrawl

# Build Firecrawl API (linux/amd64 platform for GCP Cloud Run)
cd apps/api
docker buildx build --platform linux/amd64 \
  -t $REGION-docker.pkg.dev/$PROJECT_ID/app-artifact-repository/firecrawl-api:latest .
cd ../..

# Build Firecrawl Playwright (linux/amd64 platform for GCP Cloud Run)
cd apps/playwright-service
docker buildx build --platform linux/amd64 \
  -t $REGION-docker.pkg.dev/$PROJECT_ID/app-artifact-repository/firecrawl-playwright:latest .
cd ../..
```

#### Build and Push All Images

```bash
cd ../scripts

# Get your configuration
PROJECT_ID="your-gcp-project-id"
REGION="your-gcp-region"

# Build and push all images
bash build_and_push_images.sh $PROJECT_ID $REGION

# If NOT using Firecrawl:
bash build_and_push_images.sh $PROJECT_ID $REGION --skip-firecrawl
```

Verify images were pushed:

```bash
gcloud artifacts docker images list \
  $REGION-docker.pkg.dev/$PROJECT_ID/app-artifact-repository
```

### Step 3: Deploy Database & Networking

```bash
cd ../2-db-storage

cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars
```

Key configuration options:

```hcl
google_vertex_project  = "your-gcp-project-id"
google_vertex_location = "us-central1"

# Database password (generate a secure random string)
database_password = "your-secure-database-password"

# Set to true if you plan to deploy 4-core-with-firecrawl, false for 3-core
use_firecrawl = true
```

Deploy:

```bash
terraform init
terraform plan
terraform apply
```

**Wait for deployment** (approximately 25 minutes for Cloud SQL and Redis provisioning).

After the database and networking layer is created you should configure GitHub repository Variables and Secrets so GitHub Actions can build, push, and deploy images and resources into your GCP project. Follow the instructions from the terraform output:

```bash
terraform output setup_instructions
```

### Step 4: Run Database Migrations

Push the code to github, and run the migrations github action (if it doesn't run automatically). Alternatively, you can run the migrations manually (not recommended):

```bash
# Get the job name
JOB_NAME=$(terraform output db_migrator_job_name)
REGION="your-gcp-region"

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
# GCP Configuration
google_vertex_project  = "your-gcp-project-id"
google_vertex_location = "us-central1"

# Site Configuration
site_url = "example.com"

# Authentication
better_auth_secret                 = "your-secure-secret-key"  # Generate a secure random string (32+ chars)
only_allow_admin_to_create_buckets = false
admin_user_ids                     = ""  # Comma-separated list of admin user IDs
enable_email_signup                = true
allowed_email_domains              = ""  # Comma-separated list, leave empty to allow all domains

# OAuth Providers
enable_oauth_login   = true
google_client_id     = "your-google-client-id"
google_client_secret = "your-google-client-secret"
github_client_id     = "your-github-client-id"
github_client_secret = "your-github-client-secret"
gitlab_client_id     = "your-gitlab-client-id"
gitlab_client_secret = "your-gitlab-client-secret"

# SSO Configuration (optional)
enable_sso                 = false
sso_domain                 = "your-sso-domain"
sso_provider_id            = "your-sso-provider-id"
sso_client_id              = "your-sso-client-id"
sso_client_secret          = "your-sso-client-secret"
sso_issuer                 = "your-sso-issuer"
sso_authorization_endpoint = "your-sso-authorization-endpoint"
sso_discovery_endpoint     = "your-sso-discovery-endpoint"
sso_token_endpoint         = "your-sso-token-endpoint"
sso_jwks_endpoint          = "your-sso-jwks-endpoint"

# Email Configuration
resend_sender_email = "noreply@example.com"
resend_api_key      = "your-resend-api-key"

# Application Security
encryption_key = "your-64-character-encryption-key"  # Must be exactly 64 characters

# Storage Configuration (Cloudflare R2)
use_cloudflare_r2            = false
cloudflare_access_key_id     = "your-cloudflare-access-key-id"
cloudflare_secret_access_key = "your-cloudflare-secret-access-key"
r2_endpoint                  = "https://<your-account-id>.r2.cloudflarestorage.com"

# AI Models
embeddings_model = "text-embedding-004"
llm_models       = "gemini-2.5-flash,gemini-2.5-pro"

# Use Firecrawl (only set to true if using HOSTED Firecrawl)
use_firecrawl     = false
firecrawl_api_key = "your-firecrawl-api-key"
```

#### Option B: With Firecrawl

```bash
cd ../4-core-with-firecrawl

cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars
```

Configuration (same as Option A, but Firecrawl services will be deployed):

```hcl
# GCP Configuration
google_vertex_project  = "your-gcp-project-id"
google_vertex_location = "us-central1"

# Site Configuration
site_url = "example.com"

# Authentication
better_auth_secret                 = "your-secure-secret-key"  # Generate a secure random string (32+ chars)
only_allow_admin_to_create_buckets = false
admin_user_ids                     = "user-id-1,user-id-2"  # Comma-separated list of admin user IDs
enable_email_signup                = true
allowed_email_domains              = "example.com,company.com"  # Comma-separated list

# OAuth Providers
enable_oauth_login   = true
google_client_id     = "your-google-client-id"
google_client_secret = "your-google-client-secret"
github_client_id     = "your-github-client-id"
github_client_secret = "your-github-client-secret"
gitlab_client_id     = "your-gitlab-client-id"
gitlab_client_secret = "your-gitlab-client-secret"

# SSO Configuration (optional)
enable_sso                 = false
sso_domain                 = "your-sso-domain"
sso_provider_id            = "your-sso-provider-id"
sso_client_id              = "your-sso-client-id"
sso_client_secret          = "your-sso-client-secret"
sso_issuer                 = "your-sso-issuer"
sso_authorization_endpoint = "your-sso-authorization-endpoint"
sso_discovery_endpoint     = "your-sso-discovery-endpoint"
sso_token_endpoint         = "your-sso-token-endpoint"
sso_jwks_endpoint          = "your-sso-jwks-endpoint"

# Email Configuration
resend_sender_email = "noreply@example.com"
resend_api_key      = "your-resend-api-key"

# Application Security
encryption_key = "your-64-character-encryption-key"  # Must be exactly 64 characters

# Storage Configuration (Cloudflare R2)
use_cloudflare_r2            = true
cloudflare_access_key_id     = "your-r2-access-key-id"
cloudflare_secret_access_key = "your-r2-secret-access-key"
r2_endpoint                  = "https://account-id.r2.cloudflarestorage.com"

# AI Models
embeddings_model = "text-embedding-004"
llm_models       = "gemini-2.5-flash,gemini-2.5-pro"
```

**Note**: This option deploys self-hosted Firecrawl services. No external Firecrawl API key is needed.

Deploy selected option:

```bash
terraform init
terraform plan
terraform apply
```

**Wait for deployment** (5-10 minutes for Cloud Run services and Load Balancer).

After this layer is created, you should update GitHub repository Variables and Secrets if needed (e.g., if you changed any variables). Follow the instructions from the terraform output:

```bash
terraform output setup_instructions
```

**Wait for DNS propagation** (5-30 minutes):

```bash
# Check DNS propagation
dig api.yourdomain.com

# Wait for SSL certificate provisioning
gcloud compute ssl-certificates list
```

The SSL certificate status will change from `PROVISIONING` → `ACTIVE` once DNS is verified.

### Step 6: Verify Core Services

```bash
REGION="your-gcp-region"
# Check Cloud Run services
gcloud run services list --region $REGION

# Test API health endpoint
curl https://api.yourdomain.com/api/public/health

# Test PDF Exporter health endpoint
curl https://api.yourdomain.com/pdf-exporter/public/health

# Should return: {"status":"ok"}
```

### Step 7: Deploy File Storage

**Choose ONE option:**

#### Option A: Cloud Storage

```bash
cd ../5-file-storage

cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars
```

Required variables:

```hcl
google_vertex_project  = "your-gcp-project-id"
google_vertex_location = "us-central1"

site_url               = "example.com"
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
2. Navigate to R2 Object Storage
3. Note your **Account ID** (shown in the sidebar)
4. Click "Manage" under Account Details
5. Create a token with Object Read/Write permissions
6. Copy the credentials

```bash
cd ../6-cloudflare-storage

cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars
```

In 3-core or 4-core-with-firecrawl, add the Cloudflare credentials:

```hcl
cloudflare_account_id = "your-cloudflare-account-id"
cloudflare_api_token  = "your-cloudflare-api-token"
r2_location           = "enam" # specific location like "wnam", "enam", "weur", "eeur", "apac"
```

Deploy:

```bash
terraform apply
```

## Terraform Remote State Management (Optional)

By default, Terraform state is stored locally. For team collaboration and better state management, you can use Google Cloud Storage (GCS) as a remote backend.

### Step 1: Create State Bucket

In each layer's `providers.tf`, uncomment:

```hcl
backend "gcs" {
  bucket = "your-project-terraform-state"
  prefix = "terraform/state/<layer-name>"
}
```

### Step 2: Enable Remote State in Each Layer

Each `providers.tf` file contains commented-out blocks for GCS remote state. To enable:

1. **Uncomment the `backend "gcs"` block** in the `terraform {}` block
2. **Uncomment the remote `terraform_remote_state` data source** (if applicable)
3. **Comment out the local `terraform_remote_state` data source** (if applicable)
4. **Replace `your-project-terraform-state`** with your actual bucket name

### Step 3: Migrate Existing State

If you already have local state and want to migrate to remote:

Then migrate state:

```bash
cd each-layer
terraform init -migrate-state
```

**Note**: Make sure to enable remote state in deployment order (1-repository → 2-db-storage → 3-core or 4-core-with-firecrawl → 5-file-storage or 6-cloudflare-storage) to ensure state dependencies are available.

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
