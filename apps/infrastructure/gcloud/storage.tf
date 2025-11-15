# # Activate if not using cloudflare r2 for file storage

# # Enable Cloud Storage API
# resource "google_project_service" "storage" {
#   project = var.project_id
#   service = "storage.googleapis.com"
# }

# resource "google_storage_bucket" "temporary_files_bucket" {
#   name     = "${var.project_id}-temporary-files-bucket"
#   location = var.region

#   # Prevent public access
#   public_access_prevention = "enforced"

#   # Enable uniform bucket-level access
#   uniform_bucket_level_access = true

#   # Disable object versioning
#   versioning {
#     enabled = false
#   }

#   # Disable soft delete
#   soft_delete_policy {
#     retention_duration_seconds = 0
#   }

#   # Lifecycle rule to delete objects after 1 day
#   lifecycle_rule {
#     condition {
#       age = 1
#     }
#     action {
#       type = "Delete"
#     }
#   }

#   # Add CORS configuration
#   cors {
#     origin          = ["https://app.${var.site_url}", "https://dashboard.${var.site_url}"]
#     method          = ["GET", "POST", "DELETE", "PUT", "HEAD"]
#     response_header = ["*"]
#     max_age_seconds = 3600
#   }
# }

# resource "google_storage_bucket" "files_bucket" {
#   name     = "${var.project_id}-files-bucket"
#   location = var.region

#   # Prevent public access
#   public_access_prevention = "enforced"

#   # Enable uniform bucket-level access
#   uniform_bucket_level_access = true

#   # Disable object versioning
#   versioning {
#     enabled = false
#   }

#   # Disable soft delete
#   soft_delete_policy {
#     retention_duration_seconds = 0
#   }

#   cors {
#     origin          = ["https://app.${var.site_url}", "https://dashboard.${var.site_url}"]
#     method          = ["GET", "POST", "DELETE", "PUT", "HEAD"]
#     response_header = ["*"]
#     max_age_seconds = 3600
#   }
# }
