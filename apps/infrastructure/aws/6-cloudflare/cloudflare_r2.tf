# R2 Bucket for file storage
resource "cloudflare_r2_bucket" "files_bucket" {
  account_id = var.cloudflare_account_id
  name       = "files-bucket"
  location   = var.r2_location
}

# R2 Bucket for temporary file storage
resource "cloudflare_r2_bucket" "temporary_files_bucket" {
  account_id = var.cloudflare_account_id
  name       = "temporary-files-bucket"
  location   = var.r2_location
}
