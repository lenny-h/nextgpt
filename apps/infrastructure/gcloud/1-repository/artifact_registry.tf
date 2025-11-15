# Enable Artifact Registry API
resource "google_project_service" "artifactregistry" {
  project = var.google_vertex_project
  service = "artifactregistry.googleapis.com"
}

# Artifact Registry Repository for Docker images
resource "google_artifact_registry_repository" "app_repository" {
  location      = var.google_vertex_location
  repository_id = "app-artifact-repository"
  description   = "Docker repository for application images"
  format        = "DOCKER"
  project       = var.google_vertex_project

  cleanup_policies {
    id     = "keep-last-5"
    action = "DELETE"
    condition {
      tag_state  = "ANY"
      older_than = "0s"
    }
    most_recent_versions {
      keep_count = 5
    }
  }

  depends_on = [google_project_service.artifactregistry]
}
