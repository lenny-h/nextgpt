output "artifact_registry_repository" {
  description = "Artifact Registry repository name"
  value       = google_artifact_registry_repository.docker_repo.name
}

output "artifact_registry_location" {
  description = "Artifact Registry repository location"
  value       = google_artifact_registry_repository.docker_repo.location
}

output "artifact_registry_url" {
  description = "Artifact Registry repository URL"
  value       = "${google_artifact_registry_repository.docker_repo.location}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker_repo.repository_id}"
}

output "docker_image_base_url" {
  description = "Base URL for Docker images"
  value       = "${google_artifact_registry_repository.docker_repo.location}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker_repo.repository_id}"
}

# Individual image URLs for convenience
output "api_image_url" {
  description = "API Docker image URL"
  value       = "${google_artifact_registry_repository.docker_repo.location}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker_repo.repository_id}/${var.project_name}-api:latest"
}

output "document_processor_image_url" {
  description = "Document Processor Docker image URL"
  value       = "${google_artifact_registry_repository.docker_repo.location}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker_repo.repository_id}/${var.project_name}-document-processor:latest"
}

output "pdf_exporter_image_url" {
  description = "PDF Exporter Docker image URL"
  value       = "${google_artifact_registry_repository.docker_repo.location}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker_repo.repository_id}/${var.project_name}-pdf-exporter:latest"
}

output "db_migrator_image_url" {
  description = "DB Migrator Docker image URL"
  value       = "${google_artifact_registry_repository.docker_repo.location}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker_repo.repository_id}/${var.project_name}-db-migrator:latest"
}

output "firecrawl_api_image_url" {
  description = "Firecrawl API Docker image URL"
  value       = "${google_artifact_registry_repository.docker_repo.location}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker_repo.repository_id}/${var.project_name}-firecrawl-api:latest"
}

output "firecrawl_playwright_image_url" {
  description = "Firecrawl Playwright Docker image URL"
  value       = "${google_artifact_registry_repository.docker_repo.location}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker_repo.repository_id}/${var.project_name}-firecrawl-playwright:latest"
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
