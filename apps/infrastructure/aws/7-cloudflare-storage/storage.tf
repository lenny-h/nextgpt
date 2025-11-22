# R2 Bucket for permanent file storage
resource "cloudflare_r2_bucket" "files" {
  account_id = var.cloudflare_account_id
  name       = "files-bucket"
  location   = var.r2_location
}

# R2 Bucket for temporary file storage
resource "cloudflare_r2_bucket" "temporary_files" {
  account_id = var.cloudflare_account_id
  name       = "temporary-files-bucket"
  location   = var.r2_location
}
