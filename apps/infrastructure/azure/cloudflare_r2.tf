# R2 Bucket for file storage
resource "cloudflare_r2_bucket" "storage" {
  account_id = var.cloudflare_account_id
  name       = "azure-r2-storage"
  location   = var.r2_location
}
