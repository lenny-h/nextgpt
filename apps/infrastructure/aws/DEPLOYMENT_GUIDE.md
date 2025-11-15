# AWS Infrastructure Deployment Guide

This guide walks you through deploying your infrastructure step-by-step.

## Prerequisites

- Docker installed (for building images)
- Terraform >= 1.0 installed
- AWS CLI configured with appropriate credentials
- An AWS account with necessary permissions

## Deployment Steps

### Step 1: Deploy Container Registry

```bash
cd 1-repository
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your AWS project name and region
terraform init
terraform apply
```

### Step 2: Build and Push Docker Images

After the registry is created, build and push all your container images:

```bash
cd ../scripts
# Get your AWS account ID
aws sts get-caller-identity --query Account --output text

# Run the build script
bash build_and_push_images.sh <ACCOUNT_ID> <REGION> <PROJECT_NAME>

# If you're not using Firecrawl, add --skip-firecrawl flag:
bash build_and_push_images.sh <ACCOUNT_ID> <REGION> <PROJECT_NAME> --skip-firecrawl
```

### Step 3: Deploy Database and Network Infrastructure

```bash
cd ../2-db-storage
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your configuration
terraform init
terraform apply
```

### Step 4: Run Database Migrations

After the database is created, run migrations:

```bash
# Use AWS CLI to run the db-migrator ECS task
aws ecs run-task \
  --cluster <PROJECT_NAME>-cluster \
  --task-definition <PROJECT_NAME>-db-migrator \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[<PRIVATE_SUBNET_IDS>],securityGroups=[<ECS_SECURITY_GROUP_ID>],assignPublicIp=DISABLED}"
```

### Step 5: Deploy Core Services

Choose **either** 3-core (without Firecrawl) OR 4-core-with-firecrawl (with Firecrawl):

#### Option A: Without Firecrawl

```bash
cd ../3-core
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your configuration
terraform init
terraform apply
```

#### Option B: With Firecrawl

```bash
cd ../4-core-with-firecrawl
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your configuration
# Set use_firecrawl = true
terraform init
terraform apply
```

### Step 6: Configure DNS

After core services are deployed, configure your DNS:

```bash
# Get SSL certificate validation records
terraform output dns_validation_records

# Add these DNS records to your domain provider
# Wait for SSL certificate validation (5-10 minutes)

# Get ALB DNS name
terraform output load_balancer_dns_name

# Add a CNAME record:
# Type: CNAME
# Name: api.your-domain.com
# Value: <ALB_DNS_NAME>
```

### Step 7: Configure GitHub Actions

```bash
# Get the GitHub Actions role ARN
terraform output github_actions_role_arn

# Add this to your GitHub repository variables:
# Settings > Secrets and variables > Actions > Variables
# Name: AWS_ROLE_TO_ASSUME
# Value: <ROLE_ARN>
```

### Step 8: Deploy File Storage

Choose **either** 5-file-storage (AWS S3) OR 6-cloudflare-storage (Cloudflare R2):

#### Option A: AWS S3 Storage

```bash
cd ../5-file-storage

# IMPORTANT: Update providers.tf
# If you deployed 4-core-with-firecrawl, change the remote state path:
# path = "../4-core-with-firecrawl/terraform.tfstate"

cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars
terraform init
terraform apply
```

#### Option B: Cloudflare R2 Storage

```bash
cd ../6-cloudflare-storage

# IMPORTANT: Update providers.tf
# If you deployed 4-core-with-firecrawl, change the remote state path:
# path = "../4-core-with-firecrawl/terraform.tfstate"

cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with Cloudflare credentials
terraform init
terraform apply
```

## Post-Deployment

### Verify Services

```bash
# Check ECS services are running
aws ecs list-services --cluster <PROJECT_NAME>-cluster

# Check service health
aws ecs describe-services --cluster <PROJECT_NAME>-cluster --services api document-processor pdf-exporter
```

### Test API Endpoint

```bash
# Test health endpoint
curl https://api.your-domain.com/api/health
```

## State Management (Production)

For production, you should use S3 backend for Terraform state:

1. Create an S3 bucket for Terraform state
2. Create a DynamoDB table for state locking
3. Uncomment and configure the `backend "s3"` blocks in each folder's `providers.tf`
4. Run `terraform init -migrate-state` in each folder

## Troubleshooting

### ECS Services Not Starting

```bash
# Check logs
aws logs tail /ecs/<PROJECT_NAME>/api --follow

# Check task definition
aws ecs describe-task-definition --task-definition <PROJECT_NAME>-api
```

### SSL Certificate Validation Stuck

- Verify DNS records are correctly added
- DNS propagation can take 5-30 minutes
- Check certificate status in ACM console

### Database Connection Issues

- Verify security group rules allow traffic from ECS tasks
- Check database endpoint is accessible from private subnets
- Verify secrets are correctly configured in Secrets Manager

## Updating Infrastructure

To update a specific layer:

```bash
cd <layer-folder>
terraform plan
terraform apply
```

To update ECS services after pushing new images:

```bash
# Force new deployment
aws ecs update-service --cluster <PROJECT_NAME>-cluster --service api --force-new-deployment
```

## Cleanup

To destroy infrastructure (in reverse order):

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

## Support

For issues or questions, refer to the README.md in each folder for specific documentation.
