# Create a dedicated service account for Cloud Tasks to use
resource "google_service_account" "cloud_tasks_sa" {
  account_id   = "cloud-tasks-sa"
  display_name = "Cloud Tasks Service Account"
}

# ===================================
# API Cloud Run App IAM
# ===================================

# Create Service Account for API
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

# IAM Binding to allow api service account to sign blobs (needed for getSignedUrl)
resource "google_service_account_iam_member" "api_token_creator" {
  service_account_id = google_service_account.api_sa.name
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = "serviceAccount:${google_service_account.api_sa.email}"
}

# IAM Binding to allow API service account to access secrets
resource "google_secret_manager_secret_iam_member" "api_db_password_accessor" {
  secret_id = data.terraform_remote_state.db_storage.outputs.db_password_secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.api_sa.email}"

  depends_on = [google_service_account.api_sa]
}

resource "google_secret_manager_secret_iam_member" "api_better_auth_secret_accessor" {
  secret_id = google_secret_manager_secret.better_auth_secret.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.api_sa.email}"

  depends_on = [
    google_service_account.api_sa,
    google_secret_manager_secret_version.better_auth_secret
  ]
}

resource "google_secret_manager_secret_iam_member" "api_resend_api_key_accessor" {
  secret_id = google_secret_manager_secret.resend_api_key.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.api_sa.email}"

  depends_on = [
    google_service_account.api_sa,
    google_secret_manager_secret_version.resend_api_key
  ]
}

resource "google_secret_manager_secret_iam_member" "api_r2_access_key_accessor" {
  count     = var.use_cloudflare_r2 ? 1 : 0
  secret_id = google_secret_manager_secret.cloudflare_r2_access_key_id[0].secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.api_sa.email}"
}

resource "google_secret_manager_secret_iam_member" "api_r2_secret_key_accessor" {
  count     = var.use_cloudflare_r2 ? 1 : 0
  secret_id = google_secret_manager_secret.cloudflare_r2_secret_access_key[0].secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.api_sa.email}"
}

resource "google_secret_manager_secret_iam_member" "api_encryption_key_accessor" {
  secret_id = google_secret_manager_secret.encryption_key.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.api_sa.email}"

  depends_on = [
    google_service_account.api_sa,
    google_secret_manager_secret_version.encryption_key
  ]
}

resource "google_secret_manager_secret_iam_member" "api_google_client_secret_accessor" {
  count     = var.enable_oauth_login ? 1 : 0
  secret_id = google_secret_manager_secret.google_client_secret[0].secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.api_sa.email}"
}

resource "google_secret_manager_secret_iam_member" "api_github_client_secret_accessor" {
  count     = var.enable_oauth_login ? 1 : 0
  secret_id = google_secret_manager_secret.github_client_secret[0].secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.api_sa.email}"
}

resource "google_secret_manager_secret_iam_member" "api_gitlab_client_secret_accessor" {
  count     = var.enable_oauth_login ? 1 : 0
  secret_id = google_secret_manager_secret.gitlab_client_secret[0].secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.api_sa.email}"
}

resource "google_secret_manager_secret_iam_member" "api_sso_client_secret_accessor" {
  count     = var.enable_sso ? 1 : 0
  secret_id = google_secret_manager_secret.sso_client_secret[0].secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.api_sa.email}"
}

# ===================================
# Document Processor Cloud Run App IAM
# ===================================

# Create Service Account for Document Processor
resource "google_service_account" "document_processor_sa" {
  account_id   = "document-processor-sa"
  display_name = "Document Processor Service Account"
}

# IAM Binding to allow Document Processor service account to access secrets
resource "google_secret_manager_secret_iam_member" "document_processor_db_password_accessor" {
  secret_id = data.terraform_remote_state.db_storage.outputs.db_password_secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.document_processor_sa.email}"

  depends_on = [google_service_account.document_processor_sa]
}

resource "google_secret_manager_secret_iam_member" "document_processor_encryption_key_accessor" {
  secret_id = google_secret_manager_secret.encryption_key.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.document_processor_sa.email}"

  depends_on = [
    google_service_account.document_processor_sa,
    google_secret_manager_secret_version.encryption_key
  ]
}

resource "google_secret_manager_secret_iam_member" "document_processor_r2_access_key_accessor" {
  count     = var.use_cloudflare_r2 ? 1 : 0
  secret_id = google_secret_manager_secret.cloudflare_r2_access_key_id[0].secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.document_processor_sa.email}"
}

resource "google_secret_manager_secret_iam_member" "document_processor_r2_secret_key_accessor" {
  count     = var.use_cloudflare_r2 ? 1 : 0
  secret_id = google_secret_manager_secret.cloudflare_r2_secret_access_key[0].secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.document_processor_sa.email}"
}

# ===================================
# PDF Exporter Cloud Run App IAM
# ===================================

# Create Service Account for PDF Exporter
resource "google_service_account" "pdf_exporter_sa" {
  account_id   = "pdf-exporter-sa"
  display_name = "PDF Exporter Service Account"
}

# IAM Binding to allow PDF Exporter service account to access secrets
resource "google_secret_manager_secret_iam_member" "pdf_exporter_db_password_accessor" {
  secret_id = data.terraform_remote_state.db_storage.outputs.db_password_secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.pdf_exporter_sa.email}"

  depends_on = [google_service_account.pdf_exporter_sa]
}

resource "google_secret_manager_secret_iam_member" "pdf_exporter_better_auth_secret_accessor" {
  secret_id = google_secret_manager_secret.better_auth_secret.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.pdf_exporter_sa.email}"

  depends_on = [
    google_service_account.pdf_exporter_sa,
    google_secret_manager_secret_version.better_auth_secret
  ]
}

resource "google_secret_manager_secret_iam_member" "pdf_exporter_google_client_secret_accessor" {
  count     = var.enable_oauth_login ? 1 : 0
  secret_id = google_secret_manager_secret.google_client_secret[0].secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.pdf_exporter_sa.email}"
}

resource "google_secret_manager_secret_iam_member" "pdf_exporter_github_client_secret_accessor" {
  count     = var.enable_oauth_login ? 1 : 0
  secret_id = google_secret_manager_secret.github_client_secret[0].secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.pdf_exporter_sa.email}"
}

resource "google_secret_manager_secret_iam_member" "pdf_exporter_gitlab_client_secret_accessor" {
  count     = var.enable_oauth_login ? 1 : 0
  secret_id = google_secret_manager_secret.gitlab_client_secret[0].secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.pdf_exporter_sa.email}"
}

resource "google_secret_manager_secret_iam_member" "pdf_exporter_sso_client_secret_accessor" {
  count     = var.enable_sso ? 1 : 0
  secret_id = google_secret_manager_secret.sso_client_secret[0].secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.pdf_exporter_sa.email}"
}

# ===================================
# CI/CD Service Account Permissions
# ===================================
# Note: The CI/CD service account is created in step 2 (2-db-storage)
# with project-level permissions:
# - roles/run.admin (can deploy all Cloud Run services)
# - roles/iam.serviceAccountUser (can act as all service accounts)
# Therefore, no additional resource-level permissions are needed here.
