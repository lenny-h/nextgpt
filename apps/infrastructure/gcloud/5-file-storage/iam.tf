# ===================================
# IAM Bindings for Files Bucket
# ===================================

# API service account permissions for files bucket
resource "google_storage_bucket_iam_member" "api_files_viewer" {
  bucket = google_storage_bucket.files_bucket.name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${data.terraform_remote_state.core.outputs.api_sa_email}"
}

resource "google_storage_bucket_iam_member" "api_files_creator" {
  bucket = google_storage_bucket.files_bucket.name
  role   = "roles/storage.objectCreator"
  member = "serviceAccount:${data.terraform_remote_state.core.outputs.api_sa_email}"
}

resource "google_storage_bucket_iam_member" "api_files_admin" {
  bucket = google_storage_bucket.files_bucket.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${data.terraform_remote_state.core.outputs.api_sa_email}"
}

# Document Processor service account permissions for files bucket
resource "google_storage_bucket_iam_member" "document_processor_files_viewer" {
  bucket = google_storage_bucket.files_bucket.name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${data.terraform_remote_state.core.outputs.document_processor_sa_email}"
}

resource "google_storage_bucket_iam_member" "document_processor_files_creator" {
  bucket = google_storage_bucket.files_bucket.name
  role   = "roles/storage.objectCreator"
  member = "serviceAccount:${data.terraform_remote_state.core.outputs.document_processor_sa_email}"
}

resource "google_storage_bucket_iam_member" "document_processor_files_admin" {
  bucket = google_storage_bucket.files_bucket.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${data.terraform_remote_state.core.outputs.document_processor_sa_email}"
}

# ===================================
# IAM Bindings for Temporary Files Bucket
# ===================================

# API service account permissions for temporary files bucket
resource "google_storage_bucket_iam_member" "api_temporary_files_viewer" {
  bucket = google_storage_bucket.temporary_files_bucket.name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${data.terraform_remote_state.core.outputs.api_sa_email}"
}

resource "google_storage_bucket_iam_member" "api_temporary_files_creator" {
  bucket = google_storage_bucket.temporary_files_bucket.name
  role   = "roles/storage.objectCreator"
  member = "serviceAccount:${data.terraform_remote_state.core.outputs.api_sa_email}"
}

resource "google_storage_bucket_iam_member" "api_temporary_files_admin" {
  bucket = google_storage_bucket.temporary_files_bucket.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${data.terraform_remote_state.core.outputs.api_sa_email}"
}

# Document Processor service account permissions for temporary files bucket
resource "google_storage_bucket_iam_member" "document_processor_temporary_files_viewer" {
  bucket = google_storage_bucket.temporary_files_bucket.name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${data.terraform_remote_state.core.outputs.document_processor_sa_email}"
}

resource "google_storage_bucket_iam_member" "document_processor_temporary_files_creator" {
  bucket = google_storage_bucket.temporary_files_bucket.name
  role   = "roles/storage.objectCreator"
  member = "serviceAccount:${data.terraform_remote_state.core.outputs.document_processor_sa_email}"
}

resource "google_storage_bucket_iam_member" "document_processor_temporary_files_admin" {
  bucket = google_storage_bucket.temporary_files_bucket.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${data.terraform_remote_state.core.outputs.document_processor_sa_email}"
}
