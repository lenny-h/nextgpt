# R2 Bucket for permanent file storage
resource "cloudflare_r2_bucket" "files" {
  account_id = var.cloudflare_account_id
  name       = "files-bucket"
  location   = var.r2_location
}

# CORS configuration for files bucket
resource "cloudflare_r2_bucket_cors" "files" {
  account_id  = var.cloudflare_account_id
  bucket_name = cloudflare_r2_bucket.files.name

  rules = [{
    allowed = {
      origins = ["https://app.${var.site_url}", "https://dashboard.${var.site_url}"]
      methods = ["GET", "POST", "DELETE", "PUT", "HEAD"]
      headers = ["*"]
    }
    expose_headers  = ["ETag"]
    max_age_seconds = 3600
  }]
}

# R2 Bucket for temporary file storage
resource "cloudflare_r2_bucket" "temporary_files" {
  account_id = var.cloudflare_account_id
  name       = "temporary-files-bucket"
  location   = var.r2_location
}

# CORS configuration for temporary files bucket
resource "cloudflare_r2_bucket_cors" "temporary_files" {
  account_id  = var.cloudflare_account_id
  bucket_name = cloudflare_r2_bucket.temporary_files.name

  rules = [{
    allowed = {
      origins = ["https://app.${var.site_url}", "https://dashboard.${var.site_url}"]
      methods = ["GET", "POST", "DELETE", "PUT", "HEAD"]
      headers = ["*"]
    }
    expose_headers  = ["ETag"]
    max_age_seconds = 3600
  }]
}
