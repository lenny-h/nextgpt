# Layer 5: File Storage (Cloud Storage)

This layer creates a permanent Cloud Storage bucket for file storage with versioning and IAM permissions.

## Resources Created

- **Cloud Storage Bucket**: Permanent file storage with versioning
- **IAM Bindings**: Grants Cloud Run services access to the bucket
- **Lifecycle Policy**: Keeps last 3 versions of each object

## Prerequisites

- Layer 1, 2, and 3 (or 4) must be deployed
- Choose this layer if you want to use Google Cloud Storage

## Configuration

1. Copy the example variables file:

```bash
cp terraform.tfvars.example terraform.tfvars
```

2. Edit `terraform.tfvars`:

```hcl
project_id        = "your-gcp-project-id"
region            = "us-central1"
project_name      = "myapp"
enable_versioning = true
```

3. **IMPORTANT**: Update `providers.tf` if you deployed layer 4:

```hcl
data "terraform_remote_state" "core" {
  backend = "local"
  config = {
    path = "../4-core-with-firecrawl/terraform.tfstate"  # Change this line
  }
}
```

## Deployment

```bash
# Initialize Terraform
terraform init

# Review the plan
terraform plan

# Apply the configuration
terraform apply
```

## Update Cloud Run Services

After deploying storage, update your Cloud Run services with the bucket name:

```bash
# Get bucket name
BUCKET_NAME=$(terraform output -raw permanent_storage_bucket_name)

# Update API service environment variable
gcloud run services update ${PROJECT_NAME}-api \
  --update-env-vars PERMANENT_STORAGE_BUCKET=$BUCKET_NAME \
  --region us-central1
```

## Storage Features

- **Versioning**: Enabled by default, keeps last 3 versions
- **CORS**: Configured for web uploads
- **IAM**: Cloud Run service account has objectAdmin role
- **Encryption**: Server-side encryption enabled by default
- **Location**: Regional storage for lower latency

## Cost Estimate

Monthly costs (approximate):

| Resource                 | Storage                         | Cost     |
| ------------------------ | ------------------------------- | -------- |
| Cloud Storage (Standard) | 100GB                           | $2-3     |
| Cloud Storage (Standard) | 1TB                             | $20-26   |
| Operations (per 10k)     | Class A: $0.05, Class B: $0.004 | Variable |

## Alternative: Cloudflare R2

If you want to use Cloudflare R2 instead (no egress fees), destroy this layer and deploy layer 6:

```bash
terraform destroy
cd ../6-cloudflare-storage
```

## Next Steps

Your infrastructure is now complete! You can:

1. Test file uploads/downloads
2. Configure additional lifecycle policies
3. Set up monitoring and alerts
4. Implement backup strategies
