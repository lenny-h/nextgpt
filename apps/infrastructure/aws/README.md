# AWS Infrastructure Deployment Guide

This Terraform configuration deploys a complete cloud infrastructure on AWS including:

- **Container Registry**: Amazon Elastic Container Registry (ECR) for Docker images
- **Security**: IAM roles and policies for all components
- **Networking**: VPC with private and public subnets across multiple AZs
- **Database**: Amazon RDS PostgreSQL with Multi-AZ deployment option
- **Container Services**: ECS Fargate services for API, PDF Processor, and PDF Exporter
- **Storage**: Amazon S3 buckets and Cloudflare R2
- **Background Tasks**: Amazon SQS queues for task processing
- **Cache**: Amazon ElastiCache for Redis
- **Load Balancer**: Application Load Balancer with HTTPS

## Prerequisites

- **AWS CLI** installed and authenticated (`aws configure`)
- **Terraform** >= 1.0 installed
- **AWS Account** with appropriate permissions
- **Cloudflare Account** with domain management access
- **Domain name** managed by Cloudflare

## Required Input Variables

### AWS Configuration

| Variable       | Description              | How to Obtain                                                                                                            |
| -------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `aws_region`   | AWS region for resources | Choose from [available regions](https://aws.amazon.com/about-aws/global-infrastructure/regions_az/) (default: us-east-1) |
| `project_name` | Project name prefix      | Choose a name (e.g., "nextgpt")                                                                                          |

### Database Configuration

| Variable      | Description       | Recommendations                                                               |
| ------------- | ----------------- | ----------------------------------------------------------------------------- |
| `db_password` | Database password | **Required**: Use strong password (min 8 chars, mixed case, numbers, symbols) |

### Email Configuration (Optional but Recommended)

| Variable              | Description          | How to Obtain              |
| --------------------- | -------------------- | -------------------------- |
| `resend_api_key`      | Resend API key       | From your Resend account   |
| `resend_sender_email` | Email sender address | Your verified sender email |

### Cloudflare Configuration

| Variable                          | Description           | How to Obtain                                                                                            |
| --------------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------- |
| `cloudflare_api_token`            | Cloudflare API token  | [Create API Token](https://dash.cloudflare.com/profile/api-tokens) with Zone:Read, Zone:Edit permissions |
| `cloudflare_account_id`           | Cloudflare account ID | Found in Cloudflare dashboard sidebar                                                                    |
| `cloudflare_r2_access_key_id`     | R2 access key         | [Create R2 API Token](https://dash.cloudflare.com/profile/api-tokens)                                    |
| `cloudflare_r2_secret_access_key` | R2 secret key         | Generated with R2 access key                                                                             |

## Setup Instructions

### 1. Configure Variables

Create your `terraform.tfvars` file:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your values:

```hcl
# AWS Configuration
aws_region   = "us-east-1"
project_name = "nextgpt"

# Domain Configuration
site_url = "yourdomain.com"

# Database Configuration
db_password = "your-secure-password"

# Authentication Configuration
better_auth_secret = "your-better-auth-secret"

# Email Configuration
resend_api_key       = "your-resend-api-key"
resend_sender_email  = "noreply@yourdomain.com"

# Cloudflare Configuration
cloudflare_api_token              = "your-cloudflare-api-token"
cloudflare_account_id            = "your-cloudflare-account-id"
cloudflare_r2_access_key_id      = "your-r2-access-key"
cloudflare_r2_secret_access_key  = "your-r2-secret-key"
r2_location                      = "auto"

# Encryption Configuration
encryption_key = "your-encryption-key"

# Other Configuration
allowed_email_domains = ""
embeddings_model     = "text-embedding-004"
enable_email_signup  = "false"
```

### 2. Deploy Infrastructure

```bash
# Initialize Terraform
terraform init

# Review planned changes
terraform plan

# Apply configuration
terraform apply
```

### 3. Post-Deployment Setup

After successful deployment:

1. **Note the outputs** - Save the database connection details and service URLs
2. **Update DNS** - Point your domain to the ALB DNS name
3. **Wait for SSL certificate** - ACM certificate validation may take a few minutes
4. **Test connections** - Verify all services are running and accessible

## Infrastructure Components

### ECS Fargate Services

- **API Service**: Main application backend
- **Document Processor**: Background document processing
- **PDF Exporter**: PDF generation service

### Storage Solutions

- **Amazon S3**: Temporary file storage with automatic cleanup via lifecycle policies
- **Cloudflare R2**: CDN-optimized object storage with no egress fees

### Networking

- **VPC**: Isolated network across multiple availability zones
- **Public Subnets**: ALB and NAT Gateways
- **Private Subnets**: ECS tasks, RDS, and ElastiCache
- **Security Groups**: Restrict traffic to necessary ports only

### Security & IAM

- **IAM Roles**: Task execution and task roles for each service
- **IAM Policies**: Least-privilege access permissions
- **Secrets Manager**: Secure storage of sensitive configuration
- **Security Groups**: Network-level access control

### Cache & Queue

- **ElastiCache for Redis**: In-memory cache for performance
- **Amazon SQS**: Queue for background task processing

### Load Balancing

- **Application Load Balancer**: HTTPS termination and routing
- **ACM Certificate**: Managed SSL/TLS certificate
- **Target Groups**: Health checks and traffic distribution

## Outputs

After deployment, you'll receive:

| Output                | Description            | Usage                        |
| --------------------- | ---------------------- | ---------------------------- |
| `alb_dns_name`        | Load balancer DNS name | DNS CNAME target             |
| `ecr_repository_urls` | ECR repository URLs    | CI/CD pipeline configuration |
| `database_endpoint`   | RDS endpoint           | Application configuration    |
| `redis_endpoint`      | ElastiCache endpoint   | Application configuration    |

## Security Considerations

- **Database**: Private subnet only, no public access
- **VPC**: Multi-AZ deployment for high availability
- **SSL/TLS**: Enforced for all connections via ALB and database
- **IAM**: Least-privilege roles for all services
- **Secrets Manager**: Sensitive data encrypted at rest
- **Security Groups**: Whitelist-based network access

## Cost Optimization

### Development Environment

- Database: db.t3.micro (free tier eligible)
- ECS: Fargate Spot with scale-to-zero capability
- Redis: cache.t3.micro
- NAT Gateway: Single AZ (not recommended for production)

### Production Recommendations

- Database: Multi-AZ deployment with automated backups
- ECS: Mix of On-Demand and Spot capacity
- Redis: Multi-AZ with automatic failover
- NAT Gateway: One per AZ for high availability
- Enable CloudWatch alarms and cost anomaly detection

## Troubleshooting

### Common Issues

1. **Permission Denied**: Ensure your IAM user has sufficient permissions
2. **Database Connection**: Verify security group rules and subnet routing
3. **ECS Task Failures**: Check CloudWatch logs for detailed error messages
4. **ACM Certificate**: Ensure DNS validation CNAME is added to your domain

### Debugging Commands

```bash
# Check VPC and subnets
aws ec2 describe-vpcs
aws ec2 describe-subnets

# View ECS service status
aws ecs describe-services --cluster nottelabs-cluster --services api

# Check ECS task logs
aws logs tail /ecs/api --follow

# Test database connectivity (from EC2 instance in same VPC)
psql -h <rds-endpoint> -U postgres -d postgres

# Check security group rules
aws ec2 describe-security-groups --group-ids <sg-id>
```

## Support

For infrastructure issues:

1. Check AWS Console for service status
2. Review Terraform logs for deployment errors
3. Verify all required variables are set correctly
4. Ensure account has sufficient service quotas
