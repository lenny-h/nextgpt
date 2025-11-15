# Enable the Google Secret Manager API
resource "google_project_service" "secretmanager_api" {
  service = "secretmanager.googleapis.com"
  project = var.google_vertex_project
}

# Database password
resource "google_secret_manager_secret" "db_password" {
  project   = var.google_vertex_project
  secret_id = "db-password"

  replication {
    auto {}
  }

  depends_on = [google_project_service.secretmanager_api]
}

resource "google_secret_manager_secret_version" "db_password" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = var.database_password

  depends_on = [google_project_service.secretmanager_api]
}
