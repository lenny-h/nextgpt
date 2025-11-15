output "artifact_registry_repository_id" {
  description = "The ID of the Artifact Registry repository"
  value       = google_artifact_registry_repository.app_repository.id
}

output "artifact_registry_repository_name" {
  description = "The name of the Artifact Registry repository"
  value       = google_artifact_registry_repository.app_repository.name
}

output "docker_repository_url" {
  description = "The Docker repository URL"
  value       = "${var.google_vertex_location}-docker.pkg.dev/${var.google_vertex_project}/${google_artifact_registry_repository.app_repository.repository_id}"
}

# Image URLs for each service
output "api_image_url" {
  description = "API service image URL"
  value       = "${var.google_vertex_location}-docker.pkg.dev/${var.google_vertex_project}/${google_artifact_registry_repository.app_repository.repository_id}/api"
}

output "document_processor_image_url" {
  description = "Document Processor service image URL"
  value       = "${var.google_vertex_location}-docker.pkg.dev/${var.google_vertex_project}/${google_artifact_registry_repository.app_repository.repository_id}/document-processor"
}

output "pdf_exporter_image_url" {
  description = "PDF Exporter service image URL"
  value       = "${var.google_vertex_location}-docker.pkg.dev/${var.google_vertex_project}/${google_artifact_registry_repository.app_repository.repository_id}/pdf-exporter"
}

output "db_migrator_image_url" {
  description = "DB Migrator image URL"
  value       = "${var.google_vertex_location}-docker.pkg.dev/${var.google_vertex_project}/${google_artifact_registry_repository.app_repository.repository_id}/db-migrator"
}

output "firecrawl_api_image_url" {
  description = "Firecrawl API service image URL"
  value       = "${var.google_vertex_location}-docker.pkg.dev/${var.google_vertex_project}/${google_artifact_registry_repository.app_repository.repository_id}/firecrawl"
}

output "firecrawl_playwright_image_url" {
  description = "Firecrawl Playwright service image URL"
  value       = "${var.google_vertex_location}-docker.pkg.dev/${var.google_vertex_project}/${google_artifact_registry_repository.app_repository.repository_id}/firecrawl-playwright"
}
