# Layer 6: File Storage (Cloudflare R2)

This layer creates a Cloudflare R2 bucket for permanent file storage as an alternative to Cloud Storage. R2 offers S3-compatible storage with **zero egress fees**.

## Resources Created

- **Cloudflare R2 Bucket**: S3-compatible object storage
- **Secret Manager**: Stores R2 credentials for Cloud Run services

## Prerequisites

- Layer 1, 2, and 3 (or 4) must be deployed
- Cloudflare account with R2 enabled
- R2 API credentials

## Getting R2 Credentials

1. Log in to Cloudflare Dashboard
2. Go to R2 > Overview
3. Click "Manage R2 API Tokens"
4. Create a new API token with R2 permissions
5. Note your Account ID, Access Key ID, and Secret Access Key

## Configuration

1. Copy the example variables file:

```bash
cp terraform.tfvars.example terraform.tfvars
```

2. Edit `terraform.tfvars`:

```hcl
project_id            = "your-gcp-project-id"
cloudflare_api_token  = "your-cloudflare-api-token"
cloudflare_account_id = "your-account-id"
r2_access_key_id      = "your-r2-access-key"
r2_secret_access_key  = "your-r2-secret-key"
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

After deploying R2, update your Cloud Run services with R2 configuration:

```bash
# Get bucket details
BUCKET_NAME=$(terraform output -raw r2_bucket_name)
R2_ENDPOINT=$(terraform output -raw r2_endpoint)

# Update API service environment variables
gcloud run services update ${PROJECT_NAME}-api \
  --update-env-vars PERMANENT_STORAGE_BUCKET=$BUCKET_NAME,\
STORAGE_ENDPOINT=$R2_ENDPOINT,\
STORAGE_TYPE=r2 \
  --region us-central1
```

Your application code should use the R2 credentials from Secret Manager:

- Secret: `${PROJECT_NAME}-r2-access-key`
- Secret: `${PROJECT_NAME}-r2-secret-key`

## R2 vs Cloud Storage

| Feature      | Cloudflare R2          | Cloud Storage          |
| ------------ | ---------------------- | ---------------------- |
| Egress fees  | **$0**                 | $0.12/GB               |
| Storage cost | $0.015/GB              | $0.020/GB              |
| Operations   | Standard S3 pricing    | Standard GCS pricing   |
| Best for     | High-traffic downloads | GCP-native integration |

**Use R2 when:**

- You have high egress/download volume
- You want to minimize costs
- S3 compatibility is sufficient

**Use Cloud Storage when:**

- You need GCP-native features
- You use Cloud CDN
- Egress volume is low

## S3 Compatibility

R2 is S3-compatible, so you can use any S3 SDK:

**Node.js:**

```javascript
import { S3Client } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
```

## Cost Estimate

Monthly costs for 1TB storage with 10TB egress:

| Storage       | R2      | Cloud Storage |
| ------------- | ------- | ------------- |
| Storage (1TB) | $15     | $20           |
| Egress (10TB) | **$0**  | **$1,200**    |
| **Total**     | **$15** | **$1,220**    |

**R2 savings: $1,205/month or 99% cheaper for high-traffic scenarios!**

## Next Steps

Your infrastructure is now complete! You can:

1. Test file uploads/downloads via S3 API
2. Configure custom domains for R2
3. Set up bucket lifecycle policies
4. Implement CDN caching strategies
