output "files_bucket_name" {
  description = "The name of the files bucket"
  value       = google_storage_bucket.files_bucket.name
}

output "files_bucket_url" {
  description = "The URL of the files bucket"
  value       = google_storage_bucket.files_bucket.url
}

output "files_bucket_self_link" {
  description = "The self link of the files bucket"
  value       = google_storage_bucket.files_bucket.self_link
}

output "temporary_files_bucket_name" {
  description = "The name of the temporary files bucket"
  value       = google_storage_bucket.temporary_files_bucket.name
}

output "temporary_files_bucket_url" {
  description = "The URL of the temporary files bucket"
  value       = google_storage_bucket.temporary_files_bucket.url
}

output "temporary_files_bucket_self_link" {
  description = "The self link of the temporary files bucket"
  value       = google_storage_bucket.temporary_files_bucket.self_link
}

output "setup_instructions" {
  description = "Setup instructions for GCS file storage"
  value       = <<-EOT
    
    ✅ Created GCS buckets:
       - Permanent files: ${google_storage_bucket.files_bucket.name}
       - Temporary files: ${google_storage_bucket.temporary_files_bucket.name}
       - Temporary files are automatically deleted after 1 day
       - Both buckets are configured with CORS for:
        - https://app.${var.site_url}
        - https://dashboard.${var.site_url}
    
  EOT
}
