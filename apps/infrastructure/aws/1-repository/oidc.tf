# Data source for AWS account ID
data "aws_caller_identity" "current" {}

# GitHub OIDC Provider for GitHub Actions
resource "aws_iam_openid_connect_provider" "github_actions" {
  url = "https://token.actions.githubusercontent.com"

  client_id_list = [
    "sts.amazonaws.com"
  ]

  thumbprint_list = [
    "6938fd4d98bab03faadb97b34396831e3780aea1",
    "1c58a3a8518e8759bf075b76b750d4f2df264fcd"
  ]

  tags = {
    Name = "${var.aws_project_name}-github-actions-oidc"
  }
}

# IAM Role for GitHub Actions (OIDC)
resource "aws_iam_role" "github_actions" {
  name = "${var.aws_project_name}-github-actions-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRoleWithWebIdentity"
      Effect = "Allow"
      Principal = {
        Federated = aws_iam_openid_connect_provider.github_actions.arn
      }
      Condition = {
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
        }
        StringLike = {
          "token.actions.githubusercontent.com:sub" = "repo:${var.github_repository}:*"
        }
      }
    }]
  })

  tags = {
    Name = "${var.aws_project_name}-github-actions-role"
  }
}

# Policy for GitHub Actions to push to ECR
resource "aws_iam_role_policy" "github_actions_ecr" {
  name = "${var.aws_project_name}-github-actions-ecr-policy"
  role = aws_iam_role.github_actions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload"
        ]
        Resource = [
          "arn:aws:ecr:${var.aws_region}:${data.aws_caller_identity.current.account_id}:repository/${var.aws_project_name}/*"
        ]
      }
    ]
  })
}

# Policy for GitHub Actions to manage ECS services and tasks
resource "aws_iam_role_policy" "github_actions_ecs" {
  name = "${var.aws_project_name}-github-actions-ecs-policy"
  role = aws_iam_role.github_actions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecs:DescribeTaskDefinition",
          "ecs:DescribeServices",
          "ecs:UpdateService",
          "ecs:DescribeTasks",
          "ecs:RunTask",
          "ecs:WaitTasksStopped"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "iam:PassRole"
        ]
        Resource = [
          "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/${var.aws_project_name}-ecs-task-execution-role",
          "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/${var.aws_project_name}-db-migrator-task-role"
        ]
      }
    ]
  })
}

# Policy for GitHub Actions to describe EC2 resources (for ECS task networking)
resource "aws_iam_role_policy" "github_actions_ec2" {
  name = "${var.aws_project_name}-github-actions-ec2-policy"
  role = aws_iam_role.github_actions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeVpcs",
          "ec2:DescribeSubnets",
          "ec2:DescribeSecurityGroups"
        ]
        Resource = "*"
      }
    ]
  })
}

# Policy for GitHub Actions to access CloudWatch Logs
resource "aws_iam_role_policy" "github_actions_logs" {
  name = "${var.aws_project_name}-github-actions-logs-policy"
  role = aws_iam_role.github_actions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:GetLogEvents",
          "logs:FilterLogEvents",
          "logs:DescribeLogStreams",
          "logs:DescribeLogGroups",
          "logs:StartLiveTail",
          "logs:StopLiveTail"
        ]
        Resource = [
          "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/ecs/${var.aws_project_name}/*"
        ]
      }
    ]
  })
}
