# Update IAM policies to allow access to permanent files bucket
resource "aws_iam_role_policy" "api_task_files_access" {
  name = "${var.aws_project_name}-api-task-files-policy"
  role = split("/", data.terraform_remote_state.core.outputs.api_task_role_arn)[1]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          "${aws_s3_bucket.files.arn}/*",
          "${aws_s3_bucket.temporary_files.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.files.arn,
          aws_s3_bucket.temporary_files.arn
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy" "document_processor_task_files_access" {
  name = "${var.aws_project_name}-document-processor-task-files-policy"
  role = split("/", data.terraform_remote_state.core.outputs.document_processor_task_role_arn)[1]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          "${aws_s3_bucket.files.arn}/*",
          "${aws_s3_bucket.temporary_files.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.files.arn,
          aws_s3_bucket.temporary_files.arn
        ]
      }
    ]
  })
}
