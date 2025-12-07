# ===================================
# IAM Bindings for Files Bucket
# ===================================

# API service account permissions for files bucket
resource "google_storage_bucket_iam_member" "api_files_admin" {
  bucket = google_storage_bucket.files_bucket.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${data.terraform_remote_state.core.outputs.api_sa_email}"
}

# Document Processor service account permissions for files bucket
resource "google_storage_bucket_iam_member" "document_processor_files_admin" {
  bucket = google_storage_bucket.files_bucket.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${data.terraform_remote_state.core.outputs.document_processor_sa_email}"
}

# ===================================
# IAM Bindings for Temporary Files Bucket
# ===================================

# API service account permissions for temporary files bucket
resource "google_storage_bucket_iam_member" "api_temporary_files_admin" {
  bucket = google_storage_bucket.temporary_files_bucket.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${data.terraform_remote_state.core.outputs.api_sa_email}"
}

# Document Processor service account permissions for temporary files bucket
resource "google_storage_bucket_iam_member" "document_processor_temporary_files_admin" {
  bucket = google_storage_bucket.temporary_files_bucket.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${data.terraform_remote_state.core.outputs.document_processor_sa_email}"
}

# IAM Binding to allow api service account to sign blobs (needed for getSignedUrl)
resource "google_service_account_iam_member" "api_token_creator" {
  service_account_id = "projects/${var.google_vertex_project}/serviceAccounts/${data.terraform_remote_state.core.outputs.api_sa_email}"
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = "serviceAccount:${data.terraform_remote_state.core.outputs.api_sa_email}"
}
