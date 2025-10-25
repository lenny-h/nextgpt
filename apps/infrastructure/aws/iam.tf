# IAM Role for ECS Task Execution (pulling images, writing logs)
resource "aws_iam_role" "ecs_task_execution" {
  name = "${var.project_name}-ecs-task-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })

  tags = {
    Name = "${var.project_name}-ecs-task-execution-role"
  }
}

# Attach the AWS managed policy for ECS task execution
resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Policy for ECS task execution to access Secrets Manager
resource "aws_iam_role_policy" "ecs_task_execution_secrets" {
  name = "${var.project_name}-ecs-task-execution-secrets-policy"
  role = aws_iam_role.ecs_task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          aws_secretsmanager_secret.db_password.arn,
          aws_secretsmanager_secret.better_auth_secret.arn,
          aws_secretsmanager_secret.resend_api_key.arn,
          aws_secretsmanager_secret.cloudflare_r2_access_key_id.arn,
          aws_secretsmanager_secret.cloudflare_r2_secret_access_key.arn,
          aws_secretsmanager_secret.encryption_key.arn
        ]
      }
    ]
  })
}

# IAM Role for API Task (application permissions)
resource "aws_iam_role" "api_task" {
  name = "${var.project_name}-api-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })

  tags = {
    Name = "${var.project_name}-api-task-role"
  }
}

# Policy for API to access S3, SQS, EventBridge Scheduler, and Bedrock
resource "aws_iam_role_policy" "api_task" {
  name = "${var.project_name}-api-task-policy"
  role = aws_iam_role.api_task.id

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
        Resource = "${aws_s3_bucket.temporary_files.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.temporary_files.arn
      },
      # # Activate if not using cloudflare r2 for file storage
      # {
      #   Effect = "Allow"
      #   Action = [
      #     "s3:GetObject",
      #     "s3:PutObject",
      #     "s3:DeleteObject"
      #   ]
      #   Resource = "${aws_s3_bucket.files.arn}/*"
      # },
      # {
      #   Effect = "Allow"
      #   Action = [
      #     "s3:ListBucket"
      #   ]
      #   Resource = aws_s3_bucket.files.arn
      # },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:GetQueueUrl"
        ]
        Resource = aws_sqs_queue.document_processing.arn
      },
      {
        Effect = "Allow"
        Action = [
          "scheduler:CreateSchedule",
          "scheduler:DeleteSchedule",
          "scheduler:GetSchedule"
        ]
        Resource = "arn:aws:scheduler:${var.aws_region}:*:schedule/${var.project_name}-task-schedules/*"
      },
      {
        Effect = "Allow"
        Action = [
          "iam:PassRole"
        ]
        Resource = "*"
        Condition = {
          StringLike = {
            "iam:PassedToService" = "scheduler.amazonaws.com"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel"
        ]
        Resource = "*"
      }
    ]
  })
}

# IAM Role for Document Processor Task
resource "aws_iam_role" "document_processor_task" {
  name = "${var.project_name}-document-processor-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })

  tags = {
    Name = "${var.project_name}-document-processor-task-role"
  }
}

# Policy for Document Processor to access SQS and Bedrock
resource "aws_iam_role_policy" "document_processor_task" {
  name = "${var.project_name}-document-processor-task-policy"
  role = aws_iam_role.document_processor_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.document_processing.arn
      },
      # # Uncomment if not using cloudflare r2 for file storage
      # {
      #   Effect = "Allow"
      #   Action = [
      #     "s3:GetObject",
      #     "s3:PutObject",
      #     "s3:DeleteObject"
      #   ]
      #   Resource = "${aws_s3_bucket.files.arn}/*"
      # },
      # {
      #   Effect = "Allow"
      #   Action = [
      #     "s3:ListBucket"
      #   ]
      #   Resource = aws_s3_bucket.files.arn
      # },
      {
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel"
        ]
        Resource = "*"
      }
    ]
  })
}

# IAM Role for PDF Exporter Task
resource "aws_iam_role" "pdf_exporter_task" {
  name = "${var.project_name}-pdf-exporter-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })

  tags = {
    Name = "${var.project_name}-pdf-exporter-task-role"
  }
}
