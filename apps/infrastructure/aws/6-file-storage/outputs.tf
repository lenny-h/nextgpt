output "s3_files_bucket" {
  description = "S3 bucket for permanent files"
  value       = aws_s3_bucket.files.bucket
}

output "s3_files_bucket_arn" {
  description = "S3 bucket ARN for permanent files"
  value       = aws_s3_bucket.files.arn
}
