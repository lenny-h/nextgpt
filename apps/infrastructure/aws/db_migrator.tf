# ECR Repository for DB Migrator
resource "aws_ecr_repository" "db_migrator" {
  name                 = "${var.aws_project_name}/db-migrator"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name = "${var.aws_project_name}-db-migrator"
  }
}

# ECR Lifecycle Policy
resource "aws_ecr_lifecycle_policy" "db_migrator" {
  repository = aws_ecr_repository.db_migrator.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 3 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 3
      }
      action = {
        type = "expire"
      }
    }]
  })
}

# CloudWatch Log Group for DB Migrator
resource "aws_cloudwatch_log_group" "db_migrator" {
  name              = "/ecs/${var.aws_project_name}/db-migrator"
  retention_in_days = 7

  tags = {
    Name = "${var.aws_project_name}-db-migrator-logs"
  }
}

# IAM Role for DB Migrator Task
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

# DB Migrator Task Definition
resource "aws_ecs_task_definition" "db_migrator" {
  family                   = "${var.aws_project_name}-db-migrator"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.db_migrator_task.arn

  container_definitions = jsonencode([{
    name  = "db-migrator"
    image = "${aws_ecr_repository.db_migrator.repository_url}:latest"
    environment = [
      {
        name  = "DATABASE_HOST"
        value = aws_db_instance.postgres.endpoint
      }
    ]
    secrets = [
      {
        name      = "DATABASE_PASSWORD"
        valueFrom = aws_secretsmanager_secret.db_password.arn
      }
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.db_migrator.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])

  tags = {
    Name = "${var.aws_project_name}-db-migrator-task"
  }
}
