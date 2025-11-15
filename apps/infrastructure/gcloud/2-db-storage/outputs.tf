output "postgres_private_ip" {
  value       = google_sql_database_instance.postgres.private_ip_address
  description = "Private IP address of PostgreSQL instance"
}

output "postgres_connection_name" {
  value       = google_sql_database_instance.postgres.connection_name
  description = "Connection name of PostgreSQL instance"
}

output "redis_host" {
  value       = google_redis_instance.redis.host
  description = "Redis instance host"
}

output "redis_port" {
  value       = google_redis_instance.redis.port
  description = "Redis instance port"
}

output "vpc_network_id" {
  value       = google_compute_network.private_network.id
  description = "VPC network ID"
}

output "vpc_network_name" {
  value       = google_compute_network.private_network.name
  description = "VPC network name"
}

output "vpc_subnet_id" {
  value       = google_compute_subnetwork.private_subnet.id
  description = "VPC subnet ID"
}

output "db_migrator_job_name" {
  value       = google_cloud_run_v2_job.db_migrator.name
  description = "Name of the DB migrator Cloud Run job"
}

output "db_migrator_service_account" {
  value       = google_service_account.db_migrator_sa.email
  description = "Email of DB migrator service account"
}

output "db_password_secret_id" {
  value       = google_secret_manager_secret.db_password.secret_id
  description = "ID of the database password secret"
}
