output "files_bucket_name" {
  value       = cloudflare_r2_bucket.files_bucket.name
  description = "Name of the Cloudflare R2 files bucket"
}

output "temporary_files_bucket_name" {
  value       = cloudflare_r2_bucket.temporary_files_bucket.name
  description = "Name of the Cloudflare R2 temporary files bucket"
}
