output "files_bucket_name" {
  value       = aws_s3_bucket.files.bucket
  description = "Name of the files S3 bucket"
}

output "temporary_files_bucket_name" {
  value       = aws_s3_bucket.temporary_files.bucket
  description = "Name of the temporary files S3 bucket"
}
