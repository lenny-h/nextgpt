# Infrastructure Scripts

This folder contains helper scripts for managing the infrastructure and deployments.

## build_and_push_images

This script builds Docker images for all services and pushes them to the ECR repositories created in `1-repository`.

### Usage

**Bash:**

```bash
bash build_and_push_images.sh <aws_account_id> <region> <project_name> [--skip-firecrawl] [--service <service_name>]
```

**PowerShell:**

```powershell
.\build_and_push_images.ps1 -AwsAccountId <aws_account_id> -Region <region> -ProjectName <project_name> [-SkipFirecrawl] [-Service <service_name>]
```

### Arguments

- `aws_account_id`: Your AWS Account ID
- `region`: AWS Region (e.g., `us-east-1`)
- `project_name`: The project name used in Terraform variables
- `--skip-firecrawl` / `-SkipFirecrawl`: Optional flag to skip building Firecrawl images
- `--service` / `-Service`: Optional argument to build only specific services

### Important Note on Firecrawl

For `firecrawl-api` and `firecrawl-playwright`, the script expects the images to **already exist locally** with the correct ECR tag. You must build them manually from the official Firecrawl repository before running this script.

Example for Firecrawl:

```bash
# Clone Firecrawl
git clone https://github.com/mendableai/firecrawl.git
cd firecrawl

# Build API (linux/arm64 platform for AWS ECS/Fargate)
cd apps/api
docker buildx build --platform linux/arm64 -t <account_id>.dkr.ecr.<region>.amazonaws.com/<project_name>/firecrawl-api:latest .
cd ../..

# Build Playwright (linux/arm64 platform for AWS ECS/Fargate)
cd apps/playwright-service
docker buildx build --platform linux/arm64 -t <account_id>.dkr.ecr.<region>.amazonaws.com/<project_name>/firecrawl-playwright:latest .
cd ../..
```
