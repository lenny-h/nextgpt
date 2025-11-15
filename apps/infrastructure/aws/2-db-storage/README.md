# Step 2: Database & Storage Infrastructure

This directory sets up the database, caching, and networking infrastructure on AWS.

## Prerequisites

- Step 1 (ECR repository) completed
- AWS CLI installed and configured and Terraform installed

## What This Creates

### Networking

- **VPC**: Virtual Private Cloud with CIDR 10.0.0.0/16
- **Subnets**:
  - 2 public subnets (for load balancer)
  - 2 private subnets (for ECS tasks, database, Redis)
- **Internet Gateway**: For public subnet internet access
- **NAT Gateway**: For private subnet outbound access
- **Route Tables**: Configured routing for public and private subnets

### Database

- **RDS PostgreSQL**: Managed PostgreSQL database
  - Instance: db.t3.micro (can be upgraded)
  - Multi-AZ: Disabled (can be enabled for production)
  - Automatic backups with 7-day retention
  - Private subnet only (no public access)
  - Encrypted at rest

### Caching

- **ElastiCache Redis**: Managed Redis instance
  - Node type: cache.t3.micro (1 node)
  - Redis version 7.x
  - Connected to private subnets

### Database Migration

- **ECS Task Definition**: For running database migrations
  - Pulls db-migrator image from ECR
  - Runs as a one-off task
  - Has access to database password secret

### Security

- **Security Groups**:
  - ECS tasks security group
  - PostgreSQL security group (port 5432)
  - Redis security group (port 6379)
  - ALB security group (ports 80, 443)
- **Secrets Manager**: Stores database password
- **IAM Roles**: Execution and task roles for DB migrator

## Deployment Steps

1. Copy `terraform.tfvars.example` to `terraform.tfvars` and fill in your values:

   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

2. Initialize Terraform:

   ```bash
   terraform init
   ```

3. Plan and apply:

   ```bash
   terraform plan
   terraform apply
   ```

4. Run initial database migration (after applying):

   ```bash
   # Create an ECS cluster first (or use existing)
   aws ecs create-cluster --cluster-name ${PROJECT_NAME}-cluster

   # Run the migration task
   aws ecs run-task \
     --cluster ${PROJECT_NAME}-cluster \
     --task-definition ${PROJECT_NAME}-db-migrator \
     --launch-type FARGATE \
     --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx]}"
   ```

## Outputs

After deployment, you'll get:

- VPC and subnet IDs
- PostgreSQL endpoint and address
- Redis endpoint and port
- Security group IDs
- IAM role ARNs
- Database password secret ARN

These outputs will be used by the core services in Step 3/4.

## Important Notes

- **Database Password**: Store this securely! It's used by all services
- **Network**: This VPC will be shared by all ECS services
- **Cost**: db.t3.micro + cache.t3.micro + NAT Gateway (~$40-50/month)
- **NAT Gateway**: Main cost driver for private subnet internet access
- **Multi-AZ**: Consider enabling for production workloads

## Connecting from Core Services

Core services (Step 3/4) will automatically reference these resources using Terraform data sources or by reading outputs.

## Next Steps

After successfully deploying this step:

- Run the DB migrator task to initialize the database schema
- Proceed to either `3-core/` or `4-core-with-firecrawl/`
