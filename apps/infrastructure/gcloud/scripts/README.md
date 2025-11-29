# Infrastructure Scripts

This folder contains helper scripts for managing the infrastructure and deployments.

## build_and_push_images

This script builds Docker images for all services and pushes them to the Google Artifact Registry repository created in `1-repository`.

### Usage

**Bash:**

```bash
bash build_and_push_images.sh <project_id> <region> [--skip-firecrawl] [--service <service_name>]
```

**PowerShell:**

```powershell
.\build_and_push_images.ps1 -ProjectId <project_id> -Region <region> [-SkipFirecrawl] [-Service <service_name>]
```

### Arguments

- `project_id`: Your Google Cloud Project ID
- `region`: GCP Region (e.g., `us-central1`)
- `--skip-firecrawl` / `-SkipFirecrawl`: Optional flag to skip building Firecrawl images
- `--service` / `-Service`: Optional argument to build only specific services

### Important Note on Firecrawl

For `firecrawl-api` and `firecrawl-playwright`, the script expects the images to **already exist locally** with the correct Artifact Registry tag. You must build them manually from the official Firecrawl repository before running this script.

Example for Firecrawl:

```bash
# Clone Firecrawl
git clone https://github.com/mendableai/firecrawl.git
cd firecrawl

# Build API (linux/amd64 platform for GCP Cloud Run)
cd apps/api
docker buildx build --platform linux/amd64 -t <region>-docker.pkg.dev/<project_id>/app-artifact-repository/firecrawl-api:latest .
cd ../..

# Build Playwright (linux/amd64 platform for GCP Cloud Run)
cd apps/playwright-service
docker buildx build --platform linux/amd64 -t <region>-docker.pkg.dev/<project_id>/app-artifact-repository/firecrawl-playwright:latest .
cd ../..
```
