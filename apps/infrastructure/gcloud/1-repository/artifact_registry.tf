# Artifact Registry Repository
resource "google_artifact_registry_repository" "docker_repo" {
  location      = var.region
  repository_id = "${var.project_name}-docker"
  description   = "Docker container images for ${var.project_name}"
  format        = "DOCKER"

  cleanup_policies {
    id     = "keep-last-5"
    action = "DELETE"

    condition {
      tag_state    = "ANY"
      tag_prefixes = ["latest"]
    }

    most_recent_versions {
      keep_count = 5
    }
  }

  labels = {
    project     = var.project_name
    environment = var.environment
    managed_by  = "terraform"
  }
}

# IAM binding for Cloud Build and Cloud Run to pull images
resource "google_artifact_registry_repository_iam_member" "docker_repo_reader" {
  project    = var.project_id
  location   = google_artifact_registry_repository.docker_repo.location
  repository = google_artifact_registry_repository.docker_repo.name
  role       = "roles/artifactregistry.reader"
  member     = "serviceAccount:${data.google_project.project.number}-compute@developer.gserviceaccount.com"
}

# Get project number for default compute service account
data "google_project" "project" {
  project_id = var.project_id
}
