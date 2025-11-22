# Data source for AWS account ID
data "aws_caller_identity" "current" {}

# Update IAM role policy for ECS task execution to access all secrets
resource "aws_iam_role_policy" "ecs_task_execution_secrets" {
  name = "${var.aws_project_name}-ecs-task-execution-secrets-policy"
  role = data.terraform_remote_state.db_storage.outputs.ecs_task_execution_role_arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          data.terraform_remote_state.db_storage.outputs.db_password_secret_arn,
          aws_secretsmanager_secret.better_auth_secret.arn,
          aws_secretsmanager_secret.resend_api_key.arn,
          aws_secretsmanager_secret.google_client_secret.arn,
          aws_secretsmanager_secret.github_client_secret.arn,
          aws_secretsmanager_secret.gitlab_client_secret.arn,
          aws_secretsmanager_secret.sso_client_secret.arn,
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
  name = "${var.aws_project_name}-api-task-role"

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
    Name = "${var.aws_project_name}-api-task-role"
  }
}

# Policy for API to access S3, SQS, EventBridge Scheduler, and Bedrock
resource "aws_iam_role_policy" "api_task" {
  name = "${var.aws_project_name}-api-task-policy"
  role = aws_iam_role.api_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [

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
        Resource = "arn:aws:scheduler:${var.aws_region}:*:schedule/${var.aws_project_name}-task-schedules/*"
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
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream"
        ]
        Resource = "*"
      }
    ]
  })
}

# IAM Role for Document Processor Task
resource "aws_iam_role" "document_processor_task" {
  name = "${var.aws_project_name}-document-processor-task-role"

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
    Name = "${var.aws_project_name}-document-processor-task-role"
  }
}

# Policy for Document Processor to access SQS and Bedrock
resource "aws_iam_role_policy" "document_processor_task" {
  name = "${var.aws_project_name}-document-processor-task-policy"
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
      {
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream"
        ]
        Resource = "*"
      }
    ]
  })
}

# IAM Role for PDF Exporter Task
resource "aws_iam_role" "pdf_exporter_task" {
  name = "${var.aws_project_name}-pdf-exporter-task-role"

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
    Name = "${var.aws_project_name}-pdf-exporter-task-role"
  }
}

# Policy for GitHub Actions to deploy to ECS (attached to role from repository)
resource "aws_iam_role_policy" "github_actions_ecs_deploy" {
  name = "${var.aws_project_name}-github-actions-ecs-deploy-policy"
  role = data.terraform_remote_state.repository.outputs.github_actions_role_name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecs:UpdateService",
          "ecs:DescribeServices"
        ]
        Resource = [
          "arn:aws:ecs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:service/${data.terraform_remote_state.db_storage.outputs.ecs_cluster_name}/*"
        ]
      }
    ]
  })
}
