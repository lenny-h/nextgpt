# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "${var.aws_project_name}-cluster"

  setting {
    name  = "containerInsights"
    value = "disabled"
  }

  tags = {
    Name = "${var.aws_project_name}-cluster"
  }
}

# CloudWatch Log Group for DB Migrator
resource "aws_cloudwatch_log_group" "db_migrator" {
  name              = "/ecs/${var.aws_project_name}/db-migrator"
  retention_in_days = 1

  tags = {
    Name = "${var.aws_project_name}-db-migrator-logs"
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

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "ARM64"
  }

  container_definitions = jsonencode([{
    name  = "db-migrator"
    image = data.terraform_remote_state.repository.outputs.ecr_repository_db_migrator
    environment = [
      {
        name  = "NODE_ENV"
        value = "production"
      },
      {
        name  = "DATABASE_HOST"
        value = aws_db_instance.postgres.endpoint
      },
      {
        name  = "USE_FIRECRAWL"
        value = tostring(var.use_firecrawl)
      },
      {
        name  = "EMBEDDING_DIMENSIONS"
        value = tostring(var.embedding_dimensions)
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
