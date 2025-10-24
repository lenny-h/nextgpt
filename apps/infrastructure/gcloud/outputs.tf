output "vpc_network_name" {
  description = "The name of the VPC network"
  value       = google_compute_network.private_network.name
}

output "vpc_network_id" {
  description = "The ID of the VPC network"
  value       = google_compute_network.private_network.id
}

output "vpc_subnet_name" {
  description = "The name of the VPC subnet"
  value       = google_compute_subnetwork.private_subnet.name
}

output "database_private_ip" {
  description = "The private IP address of the Cloud SQL instance"
  value       = google_sql_database_instance.postgres.private_ip_address
}

output "database_instance_connection_name" {
  description = "The connection name of the Cloud SQL instance"
  value       = google_sql_database_instance.postgres.connection_name
}

output "load_balancer_ip" {
  description = "The IP address of the HTTPS load balancer"
  value       = google_compute_global_address.lb_ip.address
}

output "ci_cd_service_account_email" {
  description = "The email of the CI/CD service account"
  value       = google_service_account.ci_cd_sa.email
}

output "ci_cd_service_account_key" {
  description = "The private key of the CI/CD service account. Add this as a secret (GCP_SA_KEY) in your GitHub repository."
  value       = google_service_account_key.ci_cd_sa_key.private_key
  sensitive   = true
}
