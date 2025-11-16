# Enable Artifact Registry API
resource "google_project_service" "artifactregistry" {
  project = var.google_vertex_project
  service = "artifactregistry.googleapis.com"
}

# Artifact Registry Repository for Docker images
resource "google_artifact_registry_repository" "app_repository" {
  project       = var.google_vertex_project
  location      = var.google_vertex_location
  repository_id = "app-artifact-repository"
  description   = "Docker repository for application images"
  format        = "DOCKER"

  cleanup_policies {
    id     = "keep-latest-5"
    action = "KEEP"

    most_recent_versions {
      keep_count = 5
    }
  }

  depends_on = [google_project_service.artifactregistry]
}
