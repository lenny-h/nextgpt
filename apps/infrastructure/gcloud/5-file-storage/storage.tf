# Enable Cloud Storage API
resource "google_project_service" "storage" {
  project = var.google_vertex_project
  service = "storage.googleapis.com"
}

# Enable IAM Credentials API (needed for signing URLs)
resource "google_project_service" "iamcredentials" {
  project = var.google_vertex_project
  service = "iamcredentials.googleapis.com"
}

# GCS bucket for permanent file storage
resource "google_storage_bucket" "files_bucket" {
  name          = "${var.google_vertex_project}-files-bucket"
  location      = var.google_vertex_location
  project       = var.google_vertex_project
  force_destroy = true # You might want to remove this to prevent deletion if the bucket is not empty

  # Prevent public access
  public_access_prevention = "enforced"

  # Enable uniform bucket-level access
  uniform_bucket_level_access = true

  # Disable object versioning
  versioning {
    enabled = false
  }

  # Disable soft delete
  soft_delete_policy {
    retention_duration_seconds = 0
  }

  # Add CORS configuration
  cors {
    origin          = ["https://app.${var.site_url}", "https://dashboard.${var.site_url}"]
    method          = ["GET", "POST", "DELETE", "PUT", "HEAD"]
    response_header = ["*"]
    max_age_seconds = 3600
  }

  depends_on = [google_project_service.storage]
}

# GCS bucket for temporary file storage
resource "google_storage_bucket" "temporary_files_bucket" {
  name          = "${var.google_vertex_project}-temporary-files-bucket"
  location      = var.google_vertex_location
  project       = var.google_vertex_project
  force_destroy = true # You might want to remove this to prevent deletion if the bucket is not empty

  # Prevent public access
  public_access_prevention = "enforced"

  # Enable uniform bucket-level access
  uniform_bucket_level_access = true

  # Disable object versioning
  versioning {
    enabled = false
  }

  # Disable soft delete
  soft_delete_policy {
    retention_duration_seconds = 0
  }

  # Add CORS configuration
  cors {
    origin          = ["https://app.${var.site_url}", "https://dashboard.${var.site_url}"]
    method          = ["GET", "POST", "DELETE", "PUT", "HEAD"]
    response_header = ["*"]
    max_age_seconds = 3600
  }

  # Lifecycle rule to delete objects after 1 day
  lifecycle_rule {
    condition {
      age = 1
    }
    action {
      type = "Delete"
    }
  }

  depends_on = [google_project_service.storage]
}
