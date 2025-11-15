output "permanent_storage_bucket_name" {
  description = "Permanent storage bucket name"
  value       = google_storage_bucket.permanent_files.name
}

output "permanent_storage_bucket_url" {
  description = "Permanent storage bucket URL"
  value       = google_storage_bucket.permanent_files.url
}

output "project_id" {
  description = "GCP Project ID"
  value       = var.project_id
}

output "region" {
  description = "GCP Region"
  value       = var.region
}
