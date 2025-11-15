# Temporary file storage bucket (1 day lifecycle)
resource "google_storage_bucket" "temporary_files" {
  name          = "${var.project_name}-temporary-files-${var.project_id}"
  location      = var.region
  force_destroy = true

  uniform_bucket_level_access = true

  lifecycle_rule {
    condition {
      age = 1
    }
    action {
      type = "Delete"
    }
  }

  cors {
    origin          = ["*"]
    method          = ["GET", "HEAD", "PUT", "POST", "DELETE"]
    response_header = ["*"]
    max_age_seconds = 3600
  }

  labels = {
    project     = var.project_name
    environment = var.environment
    type        = "temporary"
  }
}

# Grant Cloud Run service account access to temporary bucket
resource "google_storage_bucket_iam_member" "temporary_files_admin" {
  bucket = google_storage_bucket.temporary_files.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${data.terraform_remote_state.db_storage.outputs.cloud_run_service_account_email}"
}
