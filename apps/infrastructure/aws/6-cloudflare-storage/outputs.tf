output "r2_files_bucket_name" {
  description = "Cloudflare R2 bucket name for permanent files"
  value       = cloudflare_r2_bucket.files.name
}

output "r2_files_bucket_id" {
  description = "Cloudflare R2 bucket ID"
  value       = cloudflare_r2_bucket.files.id
}
