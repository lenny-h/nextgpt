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
    
    📋 GCS FILE STORAGE SETUP COMPLETE
    
    ✅ Created GCS buckets:
       - Permanent files: ${google_storage_bucket.files_bucket.name}
       - Temporary files: ${google_storage_bucket.temporary_files_bucket.name}
    
    📝 Next Steps:
    
    1️⃣ Update your application configuration
       Set USE_CLOUDFLARE_R2=false
       Set GCS_BUCKET_NAME=${google_storage_bucket.files_bucket.name}
       Set GCS_TEMPORARY_BUCKET_NAME=${google_storage_bucket.temporary_files_bucket.name}
    
    2️⃣ IAM permissions have been configured automatically
       Service accounts can now:
       - Read, write, and delete from both buckets
       - List bucket contents
    
    3️⃣ Lifecycle policy configured
       Temporary files are automatically deleted after 30 days
    
    4️⃣ CORS configuration applied
       Both buckets are configured with CORS for:
       - https://app.${var.site_url}
       - https://dashboard.${var.site_url}
    
  EOT
}
