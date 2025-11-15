output "temporary_files_bucket_name" {
  value       = google_storage_bucket.temporary_files_bucket.name
  description = "Name of the temporary files bucket"
}

output "files_bucket_name" {
  value       = google_storage_bucket.files_bucket.name
  description = "Name of the files bucket"
}
