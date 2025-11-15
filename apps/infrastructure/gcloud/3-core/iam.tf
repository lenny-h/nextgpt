# Create a dedicated service account for Cloud Tasks to use
resource "google_service_account" "cloud_tasks_sa" {
  account_id   = "cloud-tasks-sa"
  display_name = "Cloud Tasks Service Account"
}

# ===================================
# API Cloud Run App IAM
# ===================================

# Create Service Account for App
resource "google_service_account" "api_sa" {
  account_id   = "api-sa"
  display_name = "Api Service Account"
}

# IAM Binding to allow api service account to use vertex AI API
resource "google_project_iam_member" "api_vertex_ai_user" {
  project = var.google_vertex_project
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.api_sa.email}"
}

# IAM Binding to allow api service account to manage Cloud Tasks
resource "google_project_iam_member" "api_cloud_tasks_admin" {
  project = var.google_vertex_project
  role    = "roles/cloudtasks.admin"
  member  = "serviceAccount:${google_service_account.api_sa.email}"
}

# IAM Binding to allow api to act as the cloud-tasks service account
resource "google_service_account_iam_member" "handler_act_as_cloudtasks_sa" {
  service_account_id = google_service_account.cloud_tasks_sa.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.api_sa.email}"
}

# Create service account key for api
resource "google_service_account_key" "api_sa_key" {
  service_account_id = google_service_account.api_sa.name
}

# IAM Binding to allow API service account to access secrets
resource "google_secret_manager_secret_iam_member" "api_db_password_accessor" {
  secret_id = google_secret_manager_secret.db_password.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.api_sa.email}"
}

resource "google_secret_manager_secret_iam_member" "api_better_auth_secret_accessor" {
  secret_id = google_secret_manager_secret.better_auth_secret.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.api_sa.email}"
}

resource "google_secret_manager_secret_iam_member" "api_resend_api_key_accessor" {
  secret_id = google_secret_manager_secret.resend_api_key.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.api_sa.email}"
}

resource "google_secret_manager_secret_iam_member" "api_r2_access_key_accessor" {
  secret_id = google_secret_manager_secret.cloudflare_r2_access_key_id.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.api_sa.email}"
}

resource "google_secret_manager_secret_iam_member" "api_r2_secret_key_accessor" {
  secret_id = google_secret_manager_secret.cloudflare_r2_secret_access_key.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.api_sa.email}"
}

resource "google_secret_manager_secret_iam_member" "api_encryption_key_accessor" {
  secret_id = google_secret_manager_secret.encryption_key.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.api_sa.email}"
}

resource "google_secret_manager_secret_iam_member" "api_google_client_secret_accessor" {
  secret_id = google_secret_manager_secret.google_client_secret.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.api_sa.email}"
}

resource "google_secret_manager_secret_iam_member" "api_github_client_secret_accessor" {
  secret_id = google_secret_manager_secret.github_client_secret.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.api_sa.email}"
}

resource "google_secret_manager_secret_iam_member" "api_gitlab_client_secret_accessor" {
  secret_id = google_secret_manager_secret.gitlab_client_secret.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.api_sa.email}"
}

resource "google_secret_manager_secret_iam_member" "api_sso_client_secret_accessor" {
  secret_id = google_secret_manager_secret.sso_client_secret.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.api_sa.email}"
}

# ===================================
# Document Processor Cloud Run App IAM
# ===================================

# Create Service Account for Document Processor
resource "google_service_account" "document_processor_sa" {
  account_id   = "document-processor-sa"
  display_name = "document Processor Service Account"
}

# IAM Binding to allow document_processor to use vertex AI API
resource "google_project_iam_member" "document_processor_vertex_ai_user" {
  project = var.google_vertex_project
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.document_processor_sa.email}"
}

# IAM Binding to allow Document Processor service account to access secrets
resource "google_secret_manager_secret_iam_member" "document_processor_db_password_accessor" {
  secret_id = google_secret_manager_secret.db_password.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.document_processor_sa.email}"
}

resource "google_secret_manager_secret_iam_member" "document_processor_r2_access_key_accessor" {
  secret_id = google_secret_manager_secret.cloudflare_r2_access_key_id.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.document_processor_sa.email}"
}

resource "google_secret_manager_secret_iam_member" "document_processor_r2_secret_key_accessor" {
  secret_id = google_secret_manager_secret.cloudflare_r2_secret_access_key.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.document_processor_sa.email}"
}

resource "google_secret_manager_secret_iam_member" "document_processor_encryption_key_accessor" {
  secret_id = google_secret_manager_secret.encryption_key.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.document_processor_sa.email}"
}

# ===================================
# Pdf Exporter Cloud Run App IAM
# ===================================

# Create Service Account for PDF Exporter
resource "google_service_account" "pdf_exporter_sa" {
  account_id   = "pdf-exporter-sa"
  display_name = "pdf Exporter Service Account"
}

# ===================================
# CI/CD User-Assigned Managed Identity
# ===================================

# Create Service Account for CI/CD
resource "google_service_account" "ci_cd_sa" {
  account_id   = "ci-cd-sa"
  display_name = "CI/CD Service Account"
}

# Allow CI/CD service account to deploy api
resource "google_cloud_run_v2_service_iam_member" "api_deployer" {
  name     = google_cloud_run_v2_service.api.name
  location = google_cloud_run_v2_service.api.location
  role     = "roles/run.admin"
  member   = "serviceAccount:${google_service_account.ci_cd_sa.email}"
}

# Allow CI/CD service account to deploy document processor
resource "google_cloud_run_v2_service_iam_member" "document_processor_deployer" {
  name     = google_cloud_run_v2_service.document_processor.name
  location = google_cloud_run_v2_service.document_processor.location
  role     = "roles/run.admin"
  member   = "serviceAccount:${google_service_account.ci_cd_sa.email}"
}

# Allow CI/CD service account to deploy pdf exporter
resource "google_cloud_run_v2_service_iam_member" "pdf_exporter_deployer" {
  name     = google_cloud_run_v2_service.pdf_exporter.name
  location = google_cloud_run_v2_service.pdf_exporter.location
  role     = "roles/run.admin"
  member   = "serviceAccount:${google_service_account.ci_cd_sa.email}"
}

# Allow CI/CD SA to act as Api service account
resource "google_service_account_iam_member" "ci_cd_act_as_api_sa" {
  service_account_id = google_service_account.api_sa.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.ci_cd_sa.email}"
}

# Allow CI/CD SA to act as document processor service account
resource "google_service_account_iam_member" "ci_cd_act_as_document_processor_sa" {
  service_account_id = google_service_account.document_processor_sa.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.ci_cd_sa.email}"
}

# Allow CI/CD SA to act as Pdf exporter service account
resource "google_service_account_iam_member" "ci_cd_act_as_pdf_exporter_sa" {
  service_account_id = google_service_account.pdf_exporter_sa.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.ci_cd_sa.email}"
}

# Create service account key for ci_cd
resource "google_service_account_key" "ci_cd_sa_key" {
  service_account_id = google_service_account.ci_cd_sa.name
}
