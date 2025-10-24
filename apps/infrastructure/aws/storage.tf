# S3 Bucket for temporary files
resource "aws_s3_bucket" "temporary_files" {
  bucket = "${var.project_name}-temporary-files"

  tags = {
    Name = "${var.project_name}-temporary-files"
  }
}

# Block public access
resource "aws_s3_bucket_public_access_block" "temporary_files" {
  bucket = aws_s3_bucket.temporary_files.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable versioning
resource "aws_s3_bucket_versioning" "temporary_files" {
  bucket = aws_s3_bucket.temporary_files.id

  versioning_configuration {
    status = "Disabled"
  }
}

# CORS configuration
resource "aws_s3_bucket_cors_configuration" "temporary_files" {
  bucket = aws_s3_bucket.temporary_files.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "POST", "DELETE", "PUT", "HEAD"]
    allowed_origins = ["http://localhost:3000", "http://localhost:3001", "https://app.${var.site_url}", "https://dashboard.${var.site_url}"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3600
  }
}

# Lifecycle policy to delete objects after 1 day
resource "aws_s3_bucket_lifecycle_configuration" "temporary_files" {
  bucket = aws_s3_bucket.temporary_files.id

  rule {
    id     = "delete-after-1-day"
    status = "Enabled"

    expiration {
      days = 1
    }
  }
}

# Server-side encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "temporary_files" {
  bucket = aws_s3_bucket.temporary_files.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# # Uncomment if not using cloudflare r2 for file storage
# # S3 Bucket for permanent files
# resource "aws_s3_bucket" "files" {
#   bucket = "${var.project_name}-files"

#   tags = {
#     Name = "${var.project_name}-files"
#   }
# }

# # Block public access
# resource "aws_s3_bucket_public_access_block" "files" {
#   bucket = aws_s3_bucket.files.id

#   block_public_acls       = true
#   block_public_policy     = true
#   ignore_public_acls      = true
#   restrict_public_buckets = true
# }

# # Enable versioning
# resource "aws_s3_bucket_versioning" "files" {
#   bucket = aws_s3_bucket.files.id

#   versioning_configuration {
#     status = "Disabled"
#   }
# }

# # CORS configuration
# resource "aws_s3_bucket_cors_configuration" "files" {
#   bucket = aws_s3_bucket.files.id

#   cors_rule {
#     allowed_headers = ["*"]
#     allowed_methods = ["GET", "POST", "DELETE", "PUT", "HEAD"]
#     allowed_origins = ["http://localhost:3000", "http://localhost:3001", "https://app.${var.site_url}", "https://dashboard.${var.site_url}"]
#     expose_headers  = ["ETag"]
#     max_age_seconds = 3600
#   }
# }

# # Server-side encryption
# resource "aws_s3_bucket_server_side_encryption_configuration" "files" {
#   bucket = aws_s3_bucket.files.id

#   rule {
#     apply_server_side_encryption_by_default {
#       sse_algorithm = "AES256"
#     }
#   }
# }
