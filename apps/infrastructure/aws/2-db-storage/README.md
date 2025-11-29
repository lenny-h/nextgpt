# 2-db-storage - Database and Network Infrastructure

This folder sets up the networking infrastructure, databases, and the DB migrator task.

## What it provisions

- VPC with public and private subnets across multiple availability zones
- NAT Gateways for private subnet internet access
- RDS PostgreSQL database (18) in private subnets
- ElastiCache Redis cluster in private subnets
- Security groups for RDS, Redis, and ECS tasks
- ECS cluster
- DB Migrator ECS task definition
- IAM roles for ECS task execution
- Secrets Manager secret for database password

## Dependencies

This module imports state from:

- `1-repository` - ECR repository URLs

## Usage

1. Initialize Terraform:

```bash
terraform init
```

2. Copy and configure variables:

```bash
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
```

3. Apply the configuration:

```bash
terraform apply
```

## Outputs

This module exports:

- Networking resources (VPC, Subnets, Security Groups)
- Database resources (RDS endpoint, Redis endpoint)
- ECS Cluster details
- IAM Roles (Task Execution Role, Task Role)
- Secrets Manager ARNs
- GitHub Variables and Setup Instructions

These will be imported by subsequent infrastructure layers or used to configure GitHub Actions.

## Next Step

After running this, proceed to `3-core` or `4-core-with-firecrawl` to set up application services.
