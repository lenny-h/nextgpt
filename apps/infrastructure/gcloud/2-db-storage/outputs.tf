# Network outputs
output "vpc_network_id" {
  description = "The ID of the VPC network"
  value       = google_compute_network.private_network.id
}

output "vpc_network_name" {
  description = "The name of the VPC network"
  value       = google_compute_network.private_network.name
}

output "subnet_id" {
  description = "The ID of the subnet"
  value       = google_compute_subnetwork.private_subnet.id
}

output "subnet_name" {
  description = "The name of the subnet"
  value       = google_compute_subnetwork.private_subnet.name
}

# Database outputs
output "postgres_instance_name" {
  description = "The name of the Cloud SQL instance"
  value       = google_sql_database_instance.postgres.name
}

output "postgres_private_ip" {
  description = "The private IP address of the Cloud SQL instance"
  value       = google_sql_database_instance.postgres.private_ip_address
}

output "postgres_connection_name" {
  description = "The connection name of the Cloud SQL instance"
  value       = google_sql_database_instance.postgres.connection_name
}

# Redis outputs
output "redis_host" {
  description = "The host of the Redis instance"
  value       = google_redis_instance.redis.host
}

output "redis_port" {
  description = "The port of the Redis instance"
  value       = google_redis_instance.redis.port
}

output "redis_url" {
  description = "The full Redis connection URL"
  value       = "redis://${google_redis_instance.redis.host}:${google_redis_instance.redis.port}"
}

# Secret Manager outputs
output "db_password_secret_id" {
  description = "The ID of the database password secret"
  value       = google_secret_manager_secret.db_password.secret_id
}

# Service Account outputs
output "db_migrator_sa_email" {
  description = "The email of the DB Migrator service account"
  value       = google_service_account.db_migrator_sa.email
}

output "db_migrator_sa_name" {
  description = "The name of the DB Migrator service account"
  value       = google_service_account.db_migrator_sa.name
}

# DB Migrator Job output
output "db_migrator_job_name" {
  description = "The name of the DB Migrator Cloud Run job"
  value       = google_cloud_run_v2_job.db_migrator.name
}

# CI/CD Service Account outputs
output "ci_cd_sa_email" {
  description = "The email of the CI/CD service account"
  value       = google_service_account.ci_cd_sa.email
}

output "ci_cd_sa_name" {
  description = "The name of the CI/CD service account"
  value       = google_service_account.ci_cd_sa.name
}

# GitHub Secret output
output "github_secret" {
  description = "Add this as GCP_SA_KEY secret in GitHub"
  value       = google_service_account_key.ci_cd_sa_key.private_key
  sensitive   = true
}

# ========================================
# Centralized GitHub Variables + Setup
# ========================================
output "github_variables" {
  description = "Add these as GitHub repository variables (Settings > Secrets and variables > Actions > Variables)."
  value = {
    PROJECT_ID = var.google_vertex_project
    REGION     = var.google_vertex_location
    REGISTRY   = "${var.google_vertex_location}-docker.pkg.dev"
    REPOSITORY = "app-artifact-repository"
  }
}

output "github_setup_instructions" {
  description = "Follow these steps to configure GitHub actions and secrets using Terraform outputs from this module."
  value       = <<-EOT

    1️⃣ GitHub Repository Variables
       - Go to: Settings > Secrets and variables > Actions > Variables
       - Add the following variables using values retrieved from Terraform:
         * PROJECT_ID
         * REGION
         * REGISTRY
         * REPOSITORY

    2️⃣ GitHub Repository Secrets
       - Go to: Settings > Secrets and variables > Actions > Secrets
       - Add the following secret:
         * GCP_SA_KEY -> Private key JSON for the CI/CD service account
           -> Retrieve the key with: terraform output -raw github_secret > sa-key.json
           -> Copy the contents of sa-key.json into the secret value in GitHub
           -> Remove the file from disk: rm sa-key.json

    ✅ After creating the variables and secrets, push to GitHub to trigger the workflows.
  EOT
}
