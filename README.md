# Local Docker Setup

The Docker Compose in this directory allows you to run all services locally for testing purposes. Important: If you want to run web and dashboard using docker, you need additional configuration due to networking issues. The problem is the following: Supabase (kong) needs to be accessed from both the docker container (via nextjs server actions) and from the browser (for remote procedure calls), and both clients must use the same url because otherwise cookies are not set correctly. Using http://localhost:8080 works for the browser client, but not the server client. Using any other other url (such as eg http://<your-host-ip>:8080 or http://kong:8000) does not work because the supabase client will think that you're trying to connect to a remote host and thus automatically switch to https. If you're not running docker inside a vm (only possible for linux), you can simply use network:host in the docker-compose. For MacOS and Windows, solving the problem is more complex. One approach is to configure a reverse proxy (eg nginx) and then add an additional hostname for the host machine (on MacOS, this is done by editing /etc/hosts, and on Windows by editing C:\Windows\System32\drivers\etc\hosts).

## Services Included

- **PostgreSQL Database**: Replaces Google Cloud SQL
- **Analytics**: Logflare analytics service
- **Auth**: GoTrue authentication service
- **Meta**: PostgreSQL Meta service for database introspection
- **REST**: PostgREST API service
- **Studio**: Supabase Studio dashboard
- **Kong**: API Gateway that routes requests to all services
- **API**: Custom API service (optional)
- **PDF Exporter**: PDF export service (optional)
- **PDF Processor**: PDF processing service (optional)
- **Web**: Main application service (optional, requires additional configuration)
- **Dashboard**: Dashboard service (optional, requires additional configuration)

Api, PDF Exporter, PDF Processor, Web, and Dashboard services can also be started using pnpm run dev, which provides hot-reloading for development and is thus recommended.

## Prerequisites

- Docker and Docker Compose installed
- All the custom services (api, pdf-exporter, document-processor, web, dashboard) built successfully
- Access to the parent Supabase volumes directory

## Port Mapping

The services are exposed on the following local ports:

| Service            | Local Port | Container Port |
| ------------------ | ---------- | -------------- |
| Kong (API Gateway) | 8080       | 8000           |
| Kong HTTPS         | 8443       | 8443           |
| PostgreSQL         | 5432       | 5432           |
| Analytics          | 4000       | 4000           |
| Auth               | 9999       | 9999           |
| App                | 3000       | 8080           |
| Dashboard          | 3001       | 8080           |
| Studio             | 3002       | 3000           |
| REST               | 3003       | 3000           |
| API                | 3004       | 8080           |
| PDF Exporter       | 3005       | 8080           |
| PDF Processor      | 3006       | 8080           |
| Meta               | 3007       | 8080           |

## Environment Configuration

The `.env` file in the root directory contains all the necessary environment variables. Make sure to:

1. Update the secrets (passwords, keys) before running in any shared environment
2. Configure SMTP settings if you need email functionality
3. Set the `OPENAI_API_KEY` if desired

## Usage

### Start all services

```bash
cd /path/to/monorepo
docker-compose -f docker-compose.yml up -d
```

### View logs

```bash
# All services
docker-compose -f docker-compose.cloud-run.yml logs -f

# Specific service
docker-compose -f docker-compose.cloud-run.yml logs -f kong
```

### Stop all services

```bash
docker-compose -f docker-compose.cloud-run.yml down
```

### Stop and remove volumes (complete reset)

```bash
docker-compose -f docker-compose.cloud-run.yml down -v
```

## Service URLs

Once running, you can access:

- **Kong API Gateway**: http://localhost:8080
- **PostgreSQL**: localhost:5432
- **Analytics**: http://localhost:4000
- **Supabase Studio**: http://localhost:3002
- **Individual services**: Use their respective ports as listed above

## Differences from Production Cloud Run

- Uses local PostgreSQL instead of Google Cloud SQL
- All services run on the same Docker network
- Internal communication uses container names instead of Cloud Run URLs
- No Google Cloud IAM or Secret Manager integration
- All secrets are in environment variables instead of Google Secret Manager

## Troubleshooting

### Common Issues

1. **Port conflicts**: Make sure the ports aren't already in use
2. **Build failures**: Ensure the custom services (api, pdf-exporter, document-processor) can be built
3. **Database connection issues**: Check that PostgreSQL is healthy before other services start
4. **Volume mount issues**: Ensure the ../volumes directory exists and is accessible

### Health Checks

Most services include health checks. You can check the status with:

```bash
docker-compose -f docker-compose.yml ps
```

### Debugging

To debug a specific service:

```bash
# Check logs
docker-compose -f docker-compose.yml logs service-name

# Enter container
docker-compose -f docker-compose.yml exec service-name sh
```

## Notes

- This setup is intended for development and testing only
- Make sure to update all default passwords and secrets before any shared usage

# Hosted on Google Cloud

The setup can be hosted on Google Cloud by following the following steps (in the given order):

1. **Create a new project on Google Cloud** and note the project id. Enable the Artifact Registry API and create an artifact repository named `app-artifact-repository` in your desired region (e.g. europe-west1).
2. **Build and push docker images** Run the provided shell script from the root directory to build and push all necessary Docker images:

   ```bash
   bash apps/infrastructure/scripts/build_and_push_images.sh <region> <project_id>
   ```

   Replace `<region>` with your desired Google Cloud region (e.g., `europe-west1`) and `<project_id>` with your Google Cloud project ID.

3. **Create a cloudflare account** and add your domain in the overview page.
4. **Install gcloud, terraform and psql** If you are on MacOS, you can use the following commands:

   ```bash
   brew install gcloud
   brew install terraform
   brew install postgresql
   ```

   If you are on Windows, you can use the following commands (requires winget):

   ```bash
   winget install Google.Cloud.SDK
   winget install HashiCorp.Terraform
   choco install postgresql
   ```

5. **Set env variables** Set the env variables in apps/supabase/infrastructure/terraform.tfvars.example and rename the file to terraform.tfvars.
6. **Deploy infrastructure** Make sure terraform is installed, then run `terraform init` and `terraform apply` in apps/supabase/infrastructure.
7. **Run init migration script** After the terraform apply command has finished, run the setup_gcloud_database.sh script in apps/supabase/infrastructure/scripts to set up the initial database configuration:

   ```bash
   bash scripts/setup_gcloud_database.sh <db_connection_name> <db_name> <db_user> <db_password> <jwt_secret> <jwt_exp>
   ```

   Replace `<db_connection_name>`, `<db_name>`, `<db_user>`, `<db_password>`, `<jwt_secret>`, and `<jwt_exp>` can be obtained either from your terraform output or from your terraform.tfvars file.

8. **Add DNS record** Add the two A records mentioned in the output of the terraform apply command to your Cloudflare DNS settings.
9. **Create a new GitHub repository** and add the following secret:
   - `CLOUDFLARE_API_TOKEN` - A Cloudflare API token with permissions to edit cloudflare workers and cloudflare R2 storage.
   - `GCP_SA_KEY` - The private key of the CI/CD service account, which you can find in the output of the terraform apply command.

   Furthermore, add the following environment variables:
   - `SITE_URL` - The domain name for your site (e.g. yourdomain.com)
   - `PROJECT_ID` - The Google Cloud project id you obtained in step 1.
   - `REGION` - The Google Cloud region you want to use (e.g. europe-west1)
   - `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID (found in the overview page of your Cloudflare dashboard; it is also visible in the URL when you are on the overview page)
   - `R2_ENDPOINT` - The Cloudflare R2 endpoint, given by https://<account_id>.r2.cloudflarestorage.com or https://<account_id>.r2.eu.cloudflarestorage.com if you want to use an EU specific endpoint.
   - `SUPABASE_ANON_KEY` - The anon key you set in apps/supabase/infrastructure/terraform.tfvars

10. **Adapt wrangler.toml files** Change the domain in apps/web/wrangler.toml and apps/dashboard/wrangler.toml to your domain.
11. **Push to GitHub** Push your code to GitHub, which will trigger the GitHub Actions workflows and deploy all services.

# Using Hosted Supabase

To use a hosted Supabase instance instead of the self-hosted one, follow these steps:

1. **Create a new project on Supabase** and note project URL, anon key and service role key.
2. **Remove files** Remove db.tf and cloud_run_supabase.tf. Remove db_password, jwt_secret, logflare_public_access_token, and logflare_private_access_token from secrets.tf, variables.tf and terraform.tfvars. Use the values you obtained in step 1 in terraform.tfvars. Also remove deploy-supabase.yml and migrate.yml from .github/workflows.
3. **Follow the steps from the section above**
