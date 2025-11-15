# Infrastructure

This directory contains Terraform configurations for deploying the application on either **Google Cloud Platform** or **Amazon Web Services**.

## Folder Structure

```
infrastructure/
├── aws/                    # AWS deployment configurations
│   ├── 1-repository/      # ECR repositories
│   ├── 2-core/            # Core ECS services (no Firecrawl)
│   ├── 3-core-with-firecrawl/  # Core ECS services (with Firecrawl)
│   ├── 4-storage/         # S3 buckets
│   ├── 5-cloudflare/      # Cloudflare R2 buckets
│   └── scripts/           # Build and push scripts
├── gcloud/                 # Google Cloud deployment configurations
│   ├── 1-repository/      # Artifact Registry
│   ├── 2-core/            # Core Cloud Run services (no Firecrawl)
│   ├── 3-core-with-firecrawl/  # Core Cloud Run services (with Firecrawl)
│   ├── 4-storage/         # GCS buckets
│   ├── 5-cloudflare/      # Cloudflare R2 buckets
│   └── scripts/           # Build and push scripts
```

## Deployment Strategy

Both AWS and GCloud follow the same 5-step deployment pattern:

### Step 1: Repository

Create container image registry (ECR for AWS, Artifact Registry for GCloud).

### Step 2 OR 3: Core Services

Choose ONE:

- **2-core**: Lightweight deployment without web crawling (Firecrawl)
- **3-core-with-firecrawl**: Full deployment with web crawling capabilities

### Step 4 OR 5: Storage

Choose ONE:

- **4-storage**: Native cloud storage (S3 for AWS, GCS for GCloud)
- **5-cloudflare**: Cloudflare R2 (lower egress costs, better for global distribution)

## Quick Start

### For Google Cloud:

```bash
# 1. Setup repository
cd gcloud/1-repository
terraform init && terraform apply

# 2. Build and push images
cd ../scripts
bash build_and_push_images.sh <project_id> <region> [--skip-firecrawl]

# 3. Deploy core (choose one)
cd ../2-core  # OR cd ../3-core-with-firecrawl
terraform init && terraform apply

# 4. Deploy storage (choose one)
cd ../4-storage  # OR cd ../5-cloudflare
terraform init && terraform apply
```

### For AWS:

```bash
# 1. Setup repository
cd aws/1-repository
terraform init && terraform apply

# 2. Build and push images
cd ../scripts
bash build_and_push_images.sh <account_id> <region> <project_name> [--skip-firecrawl]

# 3. Deploy core (choose one)
cd ../2-core  # OR cd ../3-core-with-firecrawl
terraform init && terraform apply

# 4. Deploy storage (choose one)
cd ../4-storage  # OR cd ../5-cloudflare
terraform init && terraform apply
```

## Decision Guide

### Cloud Provider

| Feature                | AWS                            | Google Cloud               |
| ---------------------- | ------------------------------ | -------------------------- |
| **Container Platform** | ECS Fargate                    | Cloud Run                  |
| **Auto-scaling**       | Task-based                     | Request-based              |
| **Cold Start**         | Slower                         | Faster                     |
| **Cost Model**         | Per-second billing             | Per-100ms billing          |
| **Best For**           | Enterprise, complex networking | Startups, rapid deployment |

### Firecrawl

**Include Firecrawl (step 3) if you need:**

- Web scraping and crawling
- Automated content extraction from websites
- JavaScript-rendered page scraping

**Skip Firecrawl (step 2) if:**

- You don't need web crawling features
- You want a lighter deployment
- You want to minimize costs

### Storage

| Option                      | Pros                                                                 | Cons                                            |
| --------------------------- | -------------------------------------------------------------------- | ----------------------------------------------- |
| **Native Storage** (S3/GCS) | • Integrated IAM<br>• Simpler setup<br>• Native console              | • Higher egress costs<br>• Regional limitations |
| **Cloudflare R2**           | • Lower costs<br>• Global CDN<br>• No egress fees<br>• S3-compatible | • Separate service<br>• Additional credentials  |

## File Organization

Each numbered folder is **independent** and can be:

- Deployed separately
- Destroyed without affecting others (with dependencies considered)
- Re-deployed with different configurations

### Shared Resources

Core folders (2-core, 3-core-with-firecrawl) contain shared infrastructure:

- Networking (VPC, subnets, security groups)
- Databases (PostgreSQL, Redis)
- Load balancers
- IAM roles
- Application services

### Isolated Resources

- Repository folders (1-repository) only contain container registries
- Storage folders (4-storage, 5-cloudflare) only contain object storage

## Important Notes

1. **Never deploy both 2-core AND 3-core-with-firecrawl** - they conflict
2. **Never deploy both 4-storage AND 5-cloudflare** - choose one storage solution
3. **Always deploy step 1 first** and push images before deploying core
4. Each folder has a detailed README with specific instructions
5. All terraform.tfvars.example files should be copied to terraform.tfvars and configured

## Maintenance

### Updating Services

To update a service after code changes:

1. Rebuild and push images using the build script
2. ECS/Cloud Run will automatically use the new images (due to `lifecycle.ignore_changes`)
3. For force update: `gcloud run services update <service>` or update ECS service

### Switching Storage

You can switch between storage options by:

1. Destroying the current storage (terraform destroy in 4 or 5)
2. Deploying the alternative storage folder
3. Updating core service environment variables
4. Redeploying core services if needed

### Cost Optimization

- Use 2-core instead of 3-core if you don't need Firecrawl (~30% cost reduction)
- Use Cloudflare R2 for storage to reduce egress costs
- Adjust min/max instance counts in core terraform files
- Use appropriate database tiers for your load

## Support

For detailed configuration options, see:

- `/aws/README.md` - AWS-specific documentation
- `/gcloud/README.md` - Google Cloud-specific documentation
- Each numbered folder's README for step-specific details
