# Database password secret
resource "aws_secretsmanager_secret" "db_password" {
  name = "${var.aws_project_name}-db-password"

  tags = {
    Name = "${var.aws_project_name}-db-password"
  }
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = var.database_password
}

# IAM Role for DB Migrator ECS Task
resource "aws_iam_role" "db_migrator_execution" {
  name = "${var.aws_project_name}-db-migrator-execution-role"

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
    Name = "${var.aws_project_name}-db-migrator-execution-role"
  }
}

# Attach AWS managed policy for ECS task execution
resource "aws_iam_role_policy_attachment" "db_migrator_execution" {
  role       = aws_iam_role.db_migrator_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Policy for DB Migrator to access database password secret
resource "aws_iam_role_policy" "db_migrator_secrets" {
  name = "${var.aws_project_name}-db-migrator-secrets-policy"
  role = aws_iam_role.db_migrator_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          aws_secretsmanager_secret.db_password.arn
        ]
      }
    ]
  })
}

# IAM Role for DB Migrator Task (application permissions)
resource "aws_iam_role" "db_migrator_task" {
  name = "${var.aws_project_name}-db-migrator-task-role"

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
    Name = "${var.aws_project_name}-db-migrator-task-role"
  }
}
