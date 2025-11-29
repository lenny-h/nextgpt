# 5-core-with-certificate - HTTPS Setup

This folder sets up the HTTPS listener and certificate validation for the Application Load Balancer.

## What it provisions

- **ACM Certificate Validation**: Validates the SSL/TLS certificate created in the core layer
- **HTTPS Listener**: Adds an HTTPS listener on port 443 to the ALB
- **Listener Rules**: Routes traffic to appropriate services based on path (e.g., `/pdf-exporter/*`)

## Dependencies

This module imports state from:

- `3-core` OR `4-core-with-firecrawl` - ALB, Target Groups, ACM Certificate

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

**Note**: This step will wait until DNS validation is complete. Ensure you have added the CNAME records from the previous step to your DNS provider.

## Outputs

This module exports:

- HTTPS Listener ARN

## Next Step

After running this, proceed to either:

- `6-file-storage` for AWS S3 permanent file storage
- `7-cloudflare-storage` for Cloudflare R2 permanent file storage
