# Step 4: Core Infrastructure (With Firecrawl)

Deploy complete ECS services including Firecrawl on AWS.

## Prerequisites

- Step 1 (ECR repository) completed
- Step 2 (DB Storage) completed
- Docker images pushed to ECR

## What This Creates

All resources from Step 3 PLUS:

- Firecrawl API ECS service
- Firecrawl Playwright ECS service
- Additional IAM roles for Firecrawl services
- Firecrawl API key secret

**Note:** This step is identical to Step 3 but includes Firecrawl services. VPC, subnets, database, and Redis are managed in Step 2 (2-db-storage).

## Deployment

1. Copy `terraform.tfvars.example` to `terraform.tfvars` and fill in your values
2. Set `use_firecrawl = true`
3. `terraform init`
4. `terraform apply`

**Note:** This step automatically imports outputs from Steps 1 and 2 using `terraform_remote_state`. No manual variable passing needed!

## Next Step

Deploy either `5-file-storage/` (S3) or `6-cloudflare/` (R2)
