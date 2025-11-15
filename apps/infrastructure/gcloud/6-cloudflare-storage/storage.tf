# Cloudflare R2 bucket for permanent file storage
resource "cloudflare_r2_bucket" "permanent_files" {
  account_id = var.cloudflare_account_id
  name       = "${var.project_name}-permanent-files"
  location   = "auto"
}

# Store R2 credentials in Secret Manager for Cloud Run services
resource "google_secret_manager_secret" "r2_access_key" {
  secret_id = "${var.project_name}-r2-access-key"

  replication {
    auto {}
  }

  labels = {
    project     = var.project_name
    environment = var.environment
  }
}

resource "google_secret_manager_secret_version" "r2_access_key" {
  secret      = google_secret_manager_secret.r2_access_key.id
  secret_data = var.r2_access_key_id
}

resource "google_secret_manager_secret" "r2_secret_key" {
  secret_id = "${var.project_name}-r2-secret-key"

  replication {
    auto {}
  }

  labels = {
    project     = var.project_name
    environment = var.environment
  }
}

resource "google_secret_manager_secret_version" "r2_secret_key" {
  secret      = google_secret_manager_secret.r2_secret_key.id
  secret_data = var.r2_secret_access_key
}

variable "r2_access_key_id" {
  description = "R2 Access Key ID"
  type        = string
  sensitive   = true
}

variable "r2_secret_access_key" {
  description = "R2 Secret Access Key"
  type        = string
  sensitive   = true
}
