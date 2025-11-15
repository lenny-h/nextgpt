# AWS Infrastructure Overview

## Architecture Summary

Your AWS infrastructure is now organized into **6 sequential layers**, each building upon the previous one using Terraform remote state management.

```
1-repository         → Container Registry (ECR)
↓
2-db-storage         → Networking + Databases + ECS Cluster
↓
3-core               → Core Services (without Firecrawl)
  OR
4-core-with-firecrawl → Core Services (with Firecrawl)
↓
5-file-storage       → AWS S3 Permanent Storage
  OR
6-cloudflare-storage → Cloudflare R2 Storage (no egress fees)
```

## Layer Details

### Layer 1: Container Registry (`1-repository/`)

**Purpose**: ECR repositories for all Docker images  
**Resources**:

- 6 ECR repositories (api, document-processor, pdf-exporter, db-migrator, firecrawl-api, firecrawl-playwright)
- Lifecycle policy: Keep last 5 images per repository
- Scan on push enabled

**Outputs**: ECR repository URLs and ARNs

### Layer 2: Database & Storage (`2-db-storage/`)

**Purpose**: Core infrastructure layer  
**Resources**:

- **VPC**: Multi-AZ with public/private subnets
- **NAT Gateways**: For private subnet internet access
- **RDS PostgreSQL 18**: No multi-AZ currently
- **ElastiCache Redis 7.1**: No multi-AZ currently
- **ECS Cluster**: Fargate cluster for all services
- **Security Groups**: Database, Redis, ECS task security groups
- **Secrets Manager**: Database credentials
- **IAM Roles**: ECS task execution role
- **DB Migrator**: ECS task definition for running migrations

**Outputs**: VPC ID, subnet IDs, database endpoints, ECS cluster ARN, security group IDs

### Layer 3: Core Services (`3-core/`)

**Purpose**: Application services WITHOUT Firecrawl  
**Resources**:

- **ECS Services**: API, Document Processor, PDF Exporter
- **Application Load Balancer**: Public-facing with SSL/TLS
- **ACM Certificate**: SSL certificate with automatic DNS validation
- **Service Discovery**: AWS Cloud Map private DNS namespace
- **SQS Queue**: Document processing queue
- **EventBridge Scheduler**: Cleanup jobs
- **S3 Bucket**: Temporary files (1-day retention)
- **Secrets Manager**: OAuth, Auth, Encryption secrets
- **IAM Roles**: Service-specific task roles, GitHub Actions OIDC role
- **Security Groups**: ALB, API, Document Processor, PDF Exporter

**Environment**: `USE_FIRECRAWL=false`

**Service Configuration**:

- API: 2 tasks, CPU 512, Memory 1024, port 3000
- Document Processor: 1 task, CPU 1024, Memory 2048, port 5000
- PDF Exporter: 1 task, CPU 512, Memory 1024, port 8000

**Outputs**: ALB DNS, service URLs, IAM role ARNs

### Layer 4: Core with Firecrawl (`4-core-with-firecrawl/`)

**Purpose**: Alternative to Layer 3 WITH Firecrawl  
**Resources**: All Layer 3 resources PLUS:

- **Firecrawl API**: ECS service (CPU 1024, Memory 2048)
- **Firecrawl Playwright**: ECS service (CPU 1024, Memory 2048)
- **Service Discovery**: Firecrawl internal DNS
- **Secrets Manager**: Firecrawl API key
- **IAM Roles**: Firecrawl task roles
- **Security Groups**: Firecrawl security group

**Environment**: `USE_FIRECRAWL=tostring(var.use_firecrawl)`, `FIRECRAWL_API_URL` configured

**Note**: Deploy EITHER Layer 3 OR Layer 4, not both!

### Layer 5: File Storage - S3 (`5-file-storage/`)

**Purpose**: AWS S3 permanent file storage  
**Resources**:

- **S3 Bucket**: Encrypted, versioned, with lifecycle policies
- **CORS Configuration**: For web uploads
- **IAM Policies**: Grants API and Document Processor access to bucket

**Dependencies**: Imports IAM role ARNs from Layer 3 or 4

**Outputs**: S3 bucket name and ARN

### Layer 6: File Storage - Cloudflare R2 (`6-cloudflare-storage/`)

**Purpose**: Cloudflare R2 alternative (S3-compatible, no egress fees)  
**Resources**:

- **R2 Bucket**: S3-compatible object storage
- **Access Credentials**: R2 access key and secret

**Note**: Deploy EITHER Layer 5 OR Layer 6, not both!

**Outputs**: R2 bucket ID and endpoint

## Key Features

### Security

- ✅ All services in private subnets (except ALB)
- ✅ NAT Gateway for outbound internet access
- ✅ Security groups with least-privilege access
- ✅ Secrets stored in AWS Secrets Manager
- ✅ IAM roles with minimal required permissions
- ✅ S3/R2 encryption at rest
- ✅ SSL/TLS termination at ALB

### High Availability

- ✅ Multi-AZ deployment across 3 availability zones
- ✅ RDS Multi-AZ automatic failover
- ✅ Redis Multi-AZ with automatic failover
- ✅ ECS Fargate auto-scaling capability
- ✅ Application Load Balancer with health checks

### Observability

- ✅ CloudWatch Logs for all services
- ✅ 30-day log retention
- ✅ ECS task execution logs
- ✅ ALB access logs capability

### Cost Optimization

- ✅ ECR lifecycle policies (keep last 5 images)
- ✅ Temporary S3 with 1-day retention
- ✅ Cloudflare R2 option (no egress fees)
- ✅ Right-sized ECS task resources

## Deployment Choices

### Choice 1: With or Without Firecrawl

- **Without Firecrawl** (`3-core`): Lighter infrastructure, lower costs
- **With Firecrawl** (`4-core-with-firecrawl`): Web scraping capabilities

### Choice 2: S3 or Cloudflare R2

- **AWS S3** (`5-file-storage`): Native AWS integration, all AWS features
- **Cloudflare R2** (`6-cloudflare-storage`): No egress fees, good for high traffic

## State Management

Each layer imports outputs from previous layers using Terraform remote state:

```hcl
data "terraform_remote_state" "previous_layer" {
  backend = "local"  # or "s3" for production
  config = {
    path = "../previous-layer/terraform.tfstate"
  }
}
```

**Production Recommendation**: Use S3 backend with DynamoDB locking (currently commented out in `providers.tf`)

## Resource Naming Convention

All resources follow the pattern: `${var.project_name}-${resource_type}`

Example: If `project_name = "myapp"`:

- ECR: `myapp-api`, `myapp-document-processor`
- ECS Cluster: `myapp-cluster`
- RDS: `myapp-postgres`
- S3: `myapp-permanent-files`

## Environment Variables

Services receive configuration through environment variables:

- Database connection strings
- Redis connection strings
- AWS region and account info
- Service discovery endpoints
- Queue URLs
- Feature flags (USE_FIRECRAWL)

## Estimated Costs (Monthly)

Approximate costs for a small production deployment:

| Resource                           | Estimated Cost      |
| ---------------------------------- | ------------------- |
| RDS PostgreSQL (db.t3.micro)       | $15-20              |
| ElastiCache Redis (cache.t3.micro) | $15-20              |
| NAT Gateways (3 AZs)               | $100-120            |
| ECS Fargate Tasks                  | $30-50              |
| Application Load Balancer          | $20-25              |
| S3 Storage (100GB)                 | $2-3                |
| CloudWatch Logs                    | $5-10               |
| **Total (without Firecrawl)**      | **~$187-248/month** |
| Add Firecrawl services             | +$30-40/month       |

**Cost Optimization Tips**:

- Use 1 NAT Gateway instead of 3 (reduces HA but saves ~$70/month)
- Use smaller database instances for dev/staging
- Consider Cloudflare R2 for file storage (no egress fees)
- Use AWS Savings Plans or Reserved Instances for long-term

## Next Steps

1. **Review**: Check all `terraform.tfvars.example` files
2. **Configure**: Set your project name, region, domain, etc.
3. **Deploy**: Follow `DEPLOYMENT_GUIDE.md` step-by-step
4. **Test**: Verify each layer before moving to the next
5. **Monitor**: Set up CloudWatch alarms and dashboards
6. **Scale**: Adjust task counts and instance sizes as needed

## Support & Documentation

- `DEPLOYMENT_GUIDE.md`: Step-by-step deployment instructions
- `README.md` in each folder: Layer-specific documentation
- `terraform.tfvars.example`: Configuration templates

## Migration from Monolithic Setup

If you're migrating from a previous monolithic Terraform setup:

1. **Export Data**: Document current resource IDs and configurations
2. **Import State**: Use `terraform import` to bring existing resources under new structure
3. **Gradual Migration**: Move one layer at a time, starting with 1-repository
4. **Zero Downtime**: Use blue-green deployment strategy for services
5. **Validate**: Test thoroughly in staging environment first

## Troubleshooting

Common issues and solutions:

- **ECR push fails**: Ensure AWS CLI is configured and you've run `aws ecr get-login-password`
- **RDS connection timeout**: Check security group rules and subnet routing
- **ECS tasks not starting**: Check CloudWatch Logs for task errors
- **SSL certificate stuck**: Verify DNS records are added and propagated
- **State import errors**: Ensure correct backend configuration in `providers.tf`

---

**Infrastructure Version**: 1.0  
**Last Updated**: 2024  
**Terraform Version**: >= 1.0  
**AWS Provider Version**: ~> 6.18
