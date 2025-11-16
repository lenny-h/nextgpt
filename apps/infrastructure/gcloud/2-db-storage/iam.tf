# ===================================
# CI/CD Service Account for GitHub Actions
# ===================================

# Create Service Account for CI/CD
resource "google_service_account" "ci_cd_sa" {
  account_id   = "ci-cd-sa"
  display_name = "CI/CD Service Account"
}

# Grant CI/CD service account the necessary roles for artifact registry access
resource "google_project_iam_member" "ci_cd_artifact_registry_admin" {
  project = var.google_vertex_project
  role    = "roles/artifactregistry.admin"
  member  = "serviceAccount:${google_service_account.ci_cd_sa.email}"
}

# Grant CI/CD service account the ability to manage Cloud Run services
resource "google_project_iam_member" "ci_cd_run_admin" {
  project = var.google_vertex_project
  role    = "roles/run.admin"
  member  = "serviceAccount:${google_service_account.ci_cd_sa.email}"
}

# Grant CI/CD service account the ability to act as service accounts
resource "google_project_iam_member" "ci_cd_service_account_user" {
  project = var.google_vertex_project
  role    = "roles/iam.serviceAccountUser"
  member  = "serviceAccount:${google_service_account.ci_cd_sa.email}"
}

# Allow CI/CD service account to execute DB migrator job
resource "google_cloud_run_v2_job_iam_member" "db_migrator_invoker" {
  name     = google_cloud_run_v2_job.db_migrator.name
  location = var.google_vertex_location
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.ci_cd_sa.email}"
}

# Create service account key for GitHub Actions
resource "google_service_account_key" "ci_cd_sa_key" {
  service_account_id = google_service_account.ci_cd_sa.name
}
