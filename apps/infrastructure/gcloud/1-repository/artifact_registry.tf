# Enable the Artifact Registry API
resource "google_project_service" "artifact_registry_api" {
  service            = "artifactregistry.googleapis.com"
  disable_on_destroy = false
}

# Create Artifact Registry repository
resource "google_artifact_registry_repository" "app_repository" {
  location      = var.google_vertex_location
  repository_id = "app-artifact-repository"
  description   = "Docker repository for application images"
  format        = "DOCKER"

  depends_on = [google_project_service.artifact_registry_api]
}
