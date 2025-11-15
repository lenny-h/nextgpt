output "api_url" {
  description = "API Cloud Run service URL"
  value       = google_cloud_run_v2_service.api.uri
}

output "document_processor_url" {
  description = "Document Processor Cloud Run service URL"
  value       = google_cloud_run_v2_service.document_processor.uri
}

output "pdf_exporter_url" {
  description = "PDF Exporter Cloud Run service URL"
  value       = google_cloud_run_v2_service.pdf_exporter.uri
}

output "load_balancer_ip" {
  description = "Load Balancer IP address"
  value       = google_compute_global_address.lb_ip.address
}

output "domain" {
  description = "Configured domain"
  value       = var.domain
}

output "temporary_storage_bucket" {
  description = "Temporary storage bucket name"
  value       = google_storage_bucket.temporary_files.name
}

output "cloud_tasks_queue_id" {
  description = "Cloud Tasks queue ID"
  value       = google_cloud_tasks_queue.document_processing.id
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

output "cloud_run_service_account_email" {
  description = "Cloud Run service account email"
  value       = data.terraform_remote_state.db_storage.outputs.cloud_run_service_account_email
}

output "firecrawl_api_url" {
  description = "Firecrawl API Cloud Run service URL"
  value       = var.use_firecrawl ? google_cloud_run_v2_service.firecrawl_api[0].uri : null
}

output "firecrawl_playwright_url" {
  description = "Firecrawl Playwright Cloud Run service URL"
  value       = var.use_firecrawl ? google_cloud_run_v2_service.firecrawl_playwright[0].uri : null
}
