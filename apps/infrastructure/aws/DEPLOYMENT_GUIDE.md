# AWS Infrastructure Deployment Guide

Complete step-by-step guide for deploying your application on Amazon Web Services.

## Prerequisites

### Required Tools

- **AWS CLI**: [Install Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- **Terraform**: >= 1.0 [Download](https://www.terraform.io/downloads)
- **Docker**: [Install Guide](https://docs.docker.com/get-docker/)
- **Git**: For cloning the repository
- **GitHub**: For running github actions
- **Cloudflare Account**: If using Cloudflare R2 for storage

### AWS Setup

1. **Create an AWS Account** (if you don't have one):
   - Visit [aws.amazon.com](https://aws.amazon.com)
   - Follow the account creation process

2. **Configure AWS CLI**:

```bash
aws login
```

OR

```bash
aws configure
```

You'll need:

- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., `us-east-1`)
- Default output format (e.g., `json`)

3. **Verify AWS CLI Configuration**:

```bash
aws sts get-caller-identity
```

This should return your AWS account ID and user information.

## Step-by-Step Deployment

### Step 1: Deploy ECR (Elastic Container Registry)

```bash
cd apps/infrastructure/aws/1-repository

# Configure Terraform variables
cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars
# e.g. using nano: nano terraform.tfvars
```

Required variables:

```hcl
aws_project_name = "your-project-name"
aws_region       = "us-east-1"
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
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION="us-east-1"  # Your AWS region
PROJECT_NAME="your-project-name"

# Build and push all images
bash build_and_push_images.sh $AWS_ACCOUNT_ID $REGION $PROJECT_NAME

# If NOT using Firecrawl:
bash build_and_push_images.sh $AWS_ACCOUNT_ID $REGION $PROJECT_NAME --skip-firecrawl
```

Verify images were pushed:

```bash
aws ecr describe-repositories --region $REGION
aws ecr list-images --repository-name $PROJECT_NAME/api --region $REGION
```

### Step 3: Deploy Database & Networking

```bash
cd ../2-db-storage

cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars
```

Key configuration options:

```hcl
aws_project_name = "your-project-name"
aws_region       = "us-east-1"

# Database password (generate a secure random string)
database_password = "your-secure-database-password"
```

Deploy:

```bash
terraform init
terraform plan
terraform apply
```

**Wait for deployment** (approximately 15-20 minutes for RDS and ElastiCache provisioning).

### Step 4: Run Database Migrations

Push the code to GitHub, and run the migrations GitHub Action (if it doesn't run automatically). Alternatively, you can run the migrations manually using ECS:

```bash
# Get the task definition ARN
TASK_DEF=$(terraform output -raw db_migrator_task_definition_arn)
CLUSTER=$(terraform output -raw ecs_cluster_name)
SUBNETS=$(terraform output -json private_subnet_ids | jq -r '.[]' | paste -sd "," -)
SECURITY_GROUP=$(terraform output -raw ecs_security_group_id)

# Run the migration task
aws ecs run-task \
  --cluster $CLUSTER \
  --task-definition $TASK_DEF \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNETS],securityGroups=[$SECURITY_GROUP],assignPublicIp=DISABLED}" \
  --region $REGION

# Check task logs in CloudWatch Logs
# Log group: /ecs/db-migrator
aws logs tail /ecs/db-migrator --follow --region $REGION
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
# AWS Configuration
aws_project_name = "your-project-name"
aws_region       = "us-east-1"

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
# AWS Configuration
aws_project_name = "your-project-name"
aws_region       = "us-east-1"

# Site Configuration
site_url = "example.com"

# Authentication
better_auth_secret                 = "your-secure-secret-key"  # Generate a secure random string (32+ chars)
only_allow_admin_to_create_buckets = false
admin_user_ids                     = "user-id-1,user-id-2"  # Comma-separated list of admin user IDs
enable_email_signup                = true
allowed_email_domains              = "example.com,company.com"  # Comma-separated list
enable_oauth_login                 = true

# OAuth Providers
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

**Wait for deployment** (5-10 minutes for ECS services and ALB).

### Step 6: Configure DNS

Get the ALB DNS name and certificate validation records:

```bash
# Get ALB DNS name
terraform output load_balancer_dns_name

# Get certificate validation records
terraform output dns_validation_records
```

**Add DNS records:**

1. **Certificate Validation**: Add the CNAME records shown in `dns_validation_records` to your DNS provider
2. **Application Domain**: Add a CNAME record pointing `api.yourdomain.com` to the ALB DNS name

Example DNS records:

```
# Certificate validation (example)
_abc123.yourdomain.com CNAME _xyz456.acm-validations.aws.

# Application domain
api.yourdomain.com CNAME your-alb-123456.us-east-1.elb.amazonaws.com
```

**Wait for DNS propagation** (5-30 minutes):

```bash
# Check DNS propagation
nslookup api.yourdomain.com

# Wait for SSL certificate validation
aws acm describe-certificate --certificate-arn <cert-arn> --region $REGION
```

The certificate status will change from `PENDING_VALIDATION` → `ISSUED` once DNS is verified.

### Step 7: Configure GitHub Actions

Configure GitHub Actions using the outputs from the terraform deployments.

#### Part A: Infrastructure Variables (from Step 3 - db-storage)

Get the GitHub variables:

```bash
cd ../2-db-storage
terraform output github_variables
```

Add these to your GitHub repository:

1. Go to your GitHub repository → Settings → Secrets and variables → Actions → Variables
2. Add the following **variables**:
   - `AWS_PROJECT_NAME`: Your project name (e.g., `your-project-name`)
   - `AWS_REGION`: Your AWS region (e.g., `us-east-1`)
   - `AWS_ROLE_TO_ASSUME`: The IAM role ARN for GitHub Actions (from terraform output)

#### Part B: Frontend Variables (from Step 5 - core)

Get the setup instructions:

```bash
cd ../3-core  # or ../4-core-with-firecrawl
terraform output setup_instructions
```

Add these to your GitHub repository:

1. Go to your GitHub repository → Settings → Secrets and variables → Actions → Variables
2. Add the following **variables**:
   - `SITE_URL`: Your site URL (e.g., `example.com`)
   - `ENABLE_EMAIL_SIGNUP`: `true` or `false`
   - `ENABLE_OAUTH_LOGIN`: `true` or `false`
   - `ENABLE_SSO`: `true` or `false`
   - `USE_FIRECRAWL`: `true` or `false` (depends on which core layer you deployed)
   - `CSP_ENDPOINTS`: Content Security Policy endpoints (see terraform output for exact values)
   - `PDF_BBOX_DURATION_MS`: PDF BBox duration in milliseconds
   - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID (for frontend deployment)

3. Go to Secrets tab and add the following **secret**:
   - `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token (for frontend deployment)

### Step 8: Verify Core Services

```bash
# Check ECS services
aws ecs list-services --cluster $CLUSTER --region $REGION

# Test API health endpoint
curl https://api.yourdomain.com/api/public/health

# Test PDF Exporter health endpoint
curl https://api.yourdomain.com/pdf-exporter/public/health

# Should return: {"status":"ok"}
```

Check CloudWatch Logs:

```bash
# API logs
aws logs tail /ecs/api --follow --region $REGION

# Document Processor logs
aws logs tail /ecs/document-processor --follow --region $REGION

# PDF Exporter logs
aws logs tail /ecs/pdf-exporter --follow --region $REGION
```

### Step 9: Deploy File Storage

**Choose ONE option:**

#### Option A: AWS S3

```bash
cd ../6-file-storage

cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars
```

Required variables:

```hcl
aws_project_name = "your-project-name"
aws_region       = "us-east-1"
site_url         = "example.com"
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
3. Note your **Account ID** (shown in the sidebar)
4. Click "Manage R2 API Tokens"
5. Create a token with R2 read/write permissions
6. Copy the API token

```bash
cd ../7-cloudflare-storage

cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars
```

Add Cloudflare credentials:

```hcl
aws_project_name      = "your-project-name"
aws_region            = "us-east-1"
site_url              = "example.com"

cloudflare_account_id = "your-cloudflare-account-id"
cloudflare_api_token  = "your-cloudflare-api-token"
r2_location           = "auto"  # or specific location like "wnam", "enam", "weur", "eeur", "apac"
```

**IMPORTANT**: Update `providers.tf` if you deployed 4-core-with-firecrawl (same as Option A).

Deploy:

```bash
terraform init
terraform plan
terraform apply
```

## Cleanup

To destroy all infrastructure:

```bash
# Step 1: Storage layer
cd 7-cloudflare-storage  # or 6-file-storage
terraform destroy

# Step 2: Core services
cd ../4-core-with-firecrawl  # or 3-core
terraform destroy

# Step 3: Database & networking
cd ../2-db-storage
terraform destroy

# Step 4: ECR
cd ../1-repository
terraform destroy
```

**Warning**: This will delete all data! Ensure you have backups.

### Manual Cleanup (if needed)

If Terraform destroy fails, you may need to manually delete resources either via AWS Console or CLI.

## Additional Resources

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [AWS RDS Documentation](https://docs.aws.amazon.com/rds/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
