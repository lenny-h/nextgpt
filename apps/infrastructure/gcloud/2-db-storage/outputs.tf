output "vpc_id" {
  description = "VPC network ID"
  value       = google_compute_network.vpc.id
}

output "vpc_name" {
  description = "VPC network name"
  value       = google_compute_network.vpc.name
}

output "subnet_id" {
  description = "Private subnet ID"
  value       = google_compute_subnetwork.private_subnet.id
}

output "subnet_name" {
  description = "Private subnet name"
  value       = google_compute_subnetwork.private_subnet.name
}

output "vpc_network_id" {
  description = "VPC Network ID"
  value       = google_compute_network.vpc.id
}

output "vpc_subnetwork_id" {
  description = "VPC Subnetwork ID"
  value       = google_compute_subnetwork.private_subnet.id
}

output "postgres_instance_name" {
  description = "Cloud SQL PostgreSQL instance name"
  value       = google_sql_database_instance.postgres.name
}

output "postgres_connection_name" {
  description = "Cloud SQL PostgreSQL connection name"
  value       = google_sql_database_instance.postgres.connection_name
}

output "postgres_private_ip" {
  description = "Cloud SQL PostgreSQL private IP address"
  value       = google_sql_database_instance.postgres.private_ip_address
}

output "database_name" {
  description = "PostgreSQL database name"
  value       = google_sql_database.database.name
}

output "database_user" {
  description = "PostgreSQL database user"
  value       = google_sql_user.user.name
  sensitive   = true
}

output "database_password_secret_id" {
  description = "Secret Manager secret ID for database password"
  value       = google_secret_manager_secret.db_password.secret_id
}

output "database_url" {
  description = "PostgreSQL connection string"
  value       = "postgresql://${google_sql_user.user.name}:${random_password.db_password.result}@${google_sql_database_instance.postgres.private_ip_address}:5432/${google_sql_database.database.name}"
  sensitive   = true
}

output "redis_host" {
  description = "Redis host address"
  value       = google_redis_instance.redis.host
}

output "redis_port" {
  description = "Redis port"
  value       = google_redis_instance.redis.port
}

output "redis_url" {
  description = "Redis connection URL"
  value       = "redis://${google_redis_instance.redis.host}:${google_redis_instance.redis.port}"
  sensitive   = true
}

output "cloud_run_service_account_email" {
  description = "Cloud Run service account email"
  value       = google_service_account.cloud_run.email
}

output "cloud_run_service_account_id" {
  description = "Cloud Run service account ID"
  value       = google_service_account.cloud_run.id
}

output "db_migrator_job_name" {
  description = "DB Migrator Cloud Run Job name"
  value       = google_cloud_run_v2_job.db_migrator.name
}

output "project_id" {
  description = "GCP Project ID"
  value       = var.project_id
}

output "region" {
  description = "GCP Region"
  value       = var.region
}

output "project_name" {
  description = "Project name"
  value       = var.project_name
}
