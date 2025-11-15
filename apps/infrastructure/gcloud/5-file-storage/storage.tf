# Permanent file storage bucket
resource "google_storage_bucket" "permanent_files" {
  name          = "${var.project_name}-permanent-files-${var.project_id}"
  location      = var.region
  force_destroy = false

  uniform_bucket_level_access = true

  versioning {
    enabled = var.enable_versioning
  }

  lifecycle_rule {
    condition {
      num_newer_versions = 3
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
    type        = "permanent"
  }
}

# Grant Cloud Run service account access
resource "google_storage_bucket_iam_member" "permanent_files_api" {
  bucket = google_storage_bucket.permanent_files.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${data.terraform_remote_state.db_storage.outputs.cloud_run_service_account_email}"
}
