output "r2_bucket_name" {
  description = "R2 bucket name"
  value       = cloudflare_r2_bucket.permanent_files.name
}

output "r2_bucket_id" {
  description = "R2 bucket ID"
  value       = cloudflare_r2_bucket.permanent_files.id
}

output "r2_endpoint" {
  description = "R2 S3-compatible endpoint"
  value       = "https://${var.cloudflare_account_id}.r2.cloudflarestorage.com"
}

output "project_id" {
  description = "GCP Project ID"
  value       = var.project_id
}

output "region" {
  description = "GCP Region"
  value       = var.region
}
