TODO: Modify this

# Infrastructure Deployment Guide

This Terraform configuration deploys a complete cloud infrastructure including:

- **Container Registry**: Google Artifact Registry for Docker images
- **Security**: Service accounts and IAM roles for all components
- **Networking**: Private VPC network with subnet
- **Database**: Google Cloud SQL PostgreSQL with private networking
- **Cloud Run App Services**: API, PDF Processor, and PDF Exporter
- **Cloud Run Supabase Services**: Analytics, Auth, Kong, Meta, Rest, and Studio
- **Storage**: Google Cloud Storage buckets and Cloudflare R2
- **Background Tasks**: Google Cloud Tasks queues

## Prerequisites

- **Google Cloud CLI** installed and authenticated (`gcloud auth login`)
- **Terraform** >= 1.0 installed
- **Google Cloud Project** with billing enabled
- **Cloudflare Account** with domain management access
- **Domain name** managed by Cloudflare

## Required Input Variables

### Google Cloud Configuration

| Variable     | Description                | How to Obtain                                                                                               |
| ------------ | -------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `project_id` | Your GCP project ID        | Create a project in [Google Cloud Console](https://console.cloud.google.com/)                               |
| `region`     | GCP region for resources   | Choose from [available regions](https://cloud.google.com/compute/docs/regions-zones) (default: us-central1) |
| `zone`       | GCP zone within the region | Choose from zones in your selected region (default: us-central1-a)                                          |

### Database Configuration

| Variable      | Description       | Recommendations                                                               |
| ------------- | ----------------- | ----------------------------------------------------------------------------- |
| `db_password` | Database password | **Required**: Use strong password (min 8 chars, mixed case, numbers, symbols) |

### Email Configuration (Optional but Recommended)

| Variable           | Description               | How to Obtain                                   |
| ------------------ | ------------------------- | ----------------------------------------------- |
| `smtp_admin_email` | Admin email address       | Your admin email                                |
| `smtp_host`        | SMTP server hostname      | From your email provider (e.g., smtp.gmail.com) |
| `smtp_port`        | SMTP server port          | Usually 587 for TLS                             |
| `smtp_user`        | SMTP username             | Usually your email address                      |
| `smtp_pass`        | SMTP password             | App password from your email provider           |
| `smtp_sender_name` | Email sender display name | Your app or company name                        |

#### Getting SMTP Credentials:

- **Gmail**: [Create App Password](https://support.google.com/accounts/answer/185833)
- **Outlook**: [Generate App Password](https://support.microsoft.com/account-billing/using-app-passwords-with-apps-that-don-t-support-two-step-verification-5896ed9b-4263-e681-128a-a6f2979a7944)
- **SendGrid**: [API Key Setup](https://docs.sendgrid.com/ui/account-and-settings/api-keys)

### Cloudflare Configuration

| Variable                          | Description           | How to Obtain                                                                                            |
| --------------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------- |
| `cloudflare_api_token`            | Cloudflare API token  | [Create API Token](https://dash.cloudflare.com/profile/api-tokens) with Zone:Read, Zone:Edit permissions |
| `cloudflare_account_id`           | Cloudflare account ID | Found in Cloudflare dashboard sidebar                                                                    |
| `cloudflare_r2_access_key_id`     | R2 access key         | [Create R2 API Token](https://dash.cloudflare.com/profile/api-tokens)                                    |
| `cloudflare_r2_secret_access_key` | R2 secret key         | Generated with R2 access key                                                                             |

#### Getting Cloudflare Credentials:

1. **API Token**: Go to [API Tokens](https://dash.cloudflare.com/profile/api-tokens) → Create Token → Custom Token
   - Permissions: Zone:Read, Zone:Edit, Account:Read
   - Zone Resources: Include → Specific zone → Your domain
2. **Account ID**: Dashboard sidebar → Copy Account ID
3. **Zone ID**: Select your domain → Copy Zone ID from sidebar
4. **R2 Keys**: R2 Object Storage → Manage R2 API tokens → Create API token → Set R2:read, R2:write permissions

## Setup Instructions

### 1. Configure Variables

Create your `terraform.tfvars` file:

```bash
cp terraform.tfvars terraform.tfvars.backup  # Backup existing if needed
```

Edit `terraform.tfvars` with your values:

```hcl
# GCP Configuration
project_id = "your-gcp-project-id"
region     = "us-central1"
zone       = "us-central1-a"

# Database Configuration
db_password     = "your-secure-password"
studio_password = "your-supabase-admin-password"

# Supabase Configuration
jwt_exp                   = "3600"
site_url                 = "yourdomain.com"
disable_signup           = "false"

# Email Configuration (Optional)
enable_email_signup     = "true"
smtp_admin_email       = "admin@yourdomain.com"
smtp_host              = "smtp.gmail.com"
smtp_port              = "587"
smtp_user              = "noreply@yourdomain.com"
smtp_pass              = "your-app-password"
smtp_sender_name       = "Your App Name"

# Cloudflare Configuration
cloudflare_api_token              = "your-cloudflare-api-token"
cloudflare_account_id            = "your-cloudflare-account-id"
cloudflare_r2_access_key_id      = "your-r2-access-key"
cloudflare_r2_secret_access_key  = "your-r2-secret-key"
r2_location                      = "auto"
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
2. **Update DNS** - Configure your domain to point to the deployed services
3. **Test connections** - Verify all services are running and accessible

## Infrastructure Components

### Cloud Run Services

- **API Service**: Main application backend
- **PDF Processor**: Background PDF processing
- **PDF Exporter**: PDF generation service

### Cloud Run Supabase Services

- **Auth**: Authentication service
- **Analytics**: Usage analytics service
- **Kong**: API gateway
- **Meta**: Metadata service
- **Rest**: RESTful API service
- **Studio**: Supabase dashboard

### Storage Solutions

- **Google Cloud Storage**: File storage buckets for pages and temporary files
- **Cloudflare R2**: CDN-optimized object storage with no egress fees

### Networking

- **Private VPC**: Isolated network for secure communication
- **Private subnet**: Database and internal service connectivity
- **Service networking**: Secure database connections

### Security & IAM

- **Service accounts**: Dedicated accounts for each service
- **IAM roles**: Least-privilege access permissions
- **Secret management**: Secure storage of sensitive configuration

## Outputs

After deployment, you'll receive:

| Output                     | Description               | Usage                           |
| -------------------------- | ------------------------- | ------------------------------- |
| `database_connection_name` | Cloud SQL connection name | For Cloud SQL Proxy connections |
| `database_private_ip`      | Database private IP       | For direct VPC connections      |
| `database_name`            | Database name             | Application configuration       |
| `database_user`            | Database username         | Application configuration       |
| `vpc_network_name`         | VPC network name          | Cloud Run VPC connector         |
| `vpc_network_id`           | VPC network ID            | Networking configuration        |
| `vpc_subnet_name`          | VPC subnet name           | Subnet configuration            |

## Security Considerations

- **Database**: Private access only, no public IP
- **VPC**: All services communicate through private network
- **SSL/TLS**: Enforced for all database connections
- **IAM**: Least-privilege service account permissions
- **Secrets**: Sensitive data stored in Google Secret Manager
- **Authentication**: Supabase handles user authentication and authorization

## Cost Optimization

### Development Environment

- Database: `db-f1-micro` (included in free tier)
- Cloud Run: Pay-per-use with generous free tier
- Storage: First 5GB free per month

### Production Recommendations

- Database: Upgrade to `db-n1-standard-1` or higher
- Enable high availability: `availability_type = "REGIONAL"`
- Adjust backup retention based on compliance needs
- Monitor and set up billing alerts

## Troubleshooting

### Common Issues

1. **Permission Denied**: Ensure all required APIs are enabled
2. **Database Connection**: Verify VPC networking and firewall rules
3. **Service Account**: Check IAM permissions for each service
4. **Cloudflare**: Verify API token permissions and zone access

### Debugging Commands

```bash
# Check service status
gcloud run services list

# View logs
gcloud logs read --service=your-service-name

# Test database connectivity
gcloud sql connect your-instance-name --user=postgres

# Check IAM policies
gcloud projects get-iam-policy your-project-id
```

## Support

For infrastructure issues:

1. Check Google Cloud Console for service status
2. Review Terraform logs for deployment errors
3. Verify all required variables are set correctly
4. Ensure billing is enabled and quotas are sufficient
