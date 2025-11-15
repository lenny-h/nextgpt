# Database password secret
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

# Service Account for DB Migrator
resource "google_service_account" "db_migrator_sa" {
  account_id   = "db-migrator-sa"
  display_name = "DB Migrator Service Account"
}

# IAM binding to allow DB Migrator to access database password secret
resource "google_secret_manager_secret_iam_member" "db_migrator_password_accessor" {
  secret_id = google_secret_manager_secret.db_password.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.db_migrator_sa.email}"
}
