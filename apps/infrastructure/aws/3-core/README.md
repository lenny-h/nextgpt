# Step 3: Core Infrastructure (Without Firecrawl)

Deploy core ECS services without Firecrawl on AWS.

## Prerequisites

- Step 1 (ECR repository) completed
- Step 2 (DB Storage) completed - you'll need its outputs
- Docker images pushed to ECR

## What This Creates

- ECS cluster with Fargate services: API, Document Processor, PDF Exporter
- Application Load Balancer with HTTPS
- SQS queue and EventBridge Scheduler
- IAM roles and policies
- Secrets Manager secrets (application secrets only)
- Security groups for ALB and Firecrawl services

**Note:** VPC, subnets, database, Redis, and core security groups are now managed in Step 2 (2-db-storage).

## Deployment

1. Copy `terraform.tfvars.example` to `terraform.tfvars` and fill in your values
2. `terraform init`
3. `terraform apply`

**Note:** This step automatically imports outputs from Steps 1 and 2 using `terraform_remote_state`. No manual variable passing needed!

## Next Step

Deploy either `4-storage/` (S3) or `5-cloudflare/` (R2)
