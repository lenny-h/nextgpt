# Create a dedicated service account for Cloud Tasks to use
resource "google_service_account" "cloud_tasks_sa" {
  account_id   = "cloud-tasks-sa"
  display_name = "Cloud Tasks Service Account"
}

# IAM for Api Service Account -----------------------------------------------------------------------------

# Create Service Account for App
resource "google_service_account" "api_sa" {
  account_id   = "api-sa"
  display_name = "Api Service Account"
}

# IAM Binding to allow api service account to use vertex AI API
resource "google_project_iam_member" "api_vertex_ai_user" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.api_sa.email}"
}

# # Uncomment if not using cloudflare r2 for file storage
# # IAM Binding to allow api service account to read from files_bucket
# resource "google_storage_bucket_iam_member" "api_files_bucket_viewer" {
#   bucket = google_storage_bucket.files_bucket.name
#   role   = "roles/storage.objectViewer"
#   member = "serviceAccount:${google_service_account.api_sa.email}"
# }

# # Uncomment if not using cloudflare r2 for file storage
# # IAM Binding to allow api service account to delete files from files_bucket
# resource "google_storage_bucket_iam_member" "api_files_bucket_deleter" {
#   bucket = google_storage_bucket.files_bucket.name
#   role   = "roles/storage.objectAdmin"
#   member = "serviceAccount:${google_service_account.api_sa.email}"
# }

# IAM Binding to allow api service account to read from temporary_files_bucket
resource "google_storage_bucket_iam_member" "api_temporary_files_bucket_viewer" {
  bucket = google_storage_bucket.temporary_files_bucket.name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${google_service_account.api_sa.email}"
}

# IAM Binding to allow api service account to write to temporary_files_bucket
resource "google_storage_bucket_iam_member" "api_temporary_files_bucket_writer" {
  bucket = google_storage_bucket.temporary_files_bucket.name
  role   = "roles/storage.objectCreator"
  member = "serviceAccount:${google_service_account.api_sa.email}"
}

# IAM Binding to allow api service account to delete files from temporary_files_bucket
resource "google_storage_bucket_iam_member" "api_temporary_files_bucket_deleter" {
  bucket = google_storage_bucket.temporary_files_bucket.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.api_sa.email}"
}

# IAM Binding to allow api service account to manage Cloud Tasks
resource "google_project_iam_member" "api_cloud_tasks_admin" {
  project = var.project_id
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

# IAM for Document Processor -----------------------------------------------------------------------------------

# Create Service Account for Document Processor
resource "google_service_account" "document_processor_sa" {
  account_id   = "document-processor-sa"
  display_name = "document Processor Service Account"
}

# # Uncomment if not using cloudflare r2 for file storage
# # IAM Binding to allow document_processor to write to files_bucket
# resource "google_storage_bucket_iam_member" "document_processor_files_bucket_writer" {
#   bucket = google_storage_bucket.files_bucket.name
#   role   = "roles/storage.objectCreator"
#   member = "serviceAccount:${google_service_account.document_processor_sa.email}"
# }

# # Uncomment if not using cloudflare r2 for file storage
# # IAM Binding to allow document_processor to delete files from files_bucket
# resource "google_storage_bucket_iam_member" "document_processor_files_bucket_deleter" {
#   bucket = google_storage_bucket.files_bucket.name
#   role   = "roles/storage.objectAdmin"
#   member = "serviceAccount:${google_service_account.document_processor_sa.email}"
# }

# IAM Binding to allow document_processor to use vertex AI API
resource "google_project_iam_member" "document_processor_vertex_ai_user" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.document_processor_sa.email}"
}

# IAM for PDF Exporter ------------------------------------------------------------------------------------

# Create Service Account for PDF Exporter
resource "google_service_account" "pdf_exporter_sa" {
  account_id   = "pdf-exporter-sa"
  display_name = "pdf Exporter Service Account"
}

# IAM for CI/CD -------------------------------------------------------------------------------------------

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
