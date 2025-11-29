# ==============================================================================
# Firecrawl Services
# ==============================================================================

# CloudWatch Log Groups for Firecrawl
resource "aws_cloudwatch_log_group" "firecrawl_api" {
  name              = "/ecs/${var.aws_project_name}/firecrawl-api"
  retention_in_days = 7

  tags = {
    Name = "${var.aws_project_name}-firecrawl-api-logs"
  }
}

resource "aws_cloudwatch_log_group" "firecrawl_playwright" {
  name              = "/ecs/${var.aws_project_name}/firecrawl-playwright"
  retention_in_days = 7

  tags = {
    Name = "${var.aws_project_name}-firecrawl-playwright-logs"
  }
}

# Firecrawl API Task Definition
resource "aws_ecs_task_definition" "firecrawl_api" {
  family                   = "${var.aws_project_name}-firecrawl-api"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "1024"
  memory                   = "2048"
  execution_role_arn       = data.terraform_remote_state.db_storage.outputs.ecs_task_execution_role_arn
  task_role_arn            = aws_iam_role.firecrawl_api_task.arn

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "ARM64"
  }

  container_definitions = jsonencode([{
    name  = "firecrawl-api"
    image = "${data.terraform_remote_state.repository.outputs.ecr_repository_firecrawl_api}:latest"
    portMappings = [{
      containerPort = 8080
      protocol      = "tcp"
    }]
    environment = [
      {
        name  = "HOST"
        value = "0.0.0.0"
      },
      {
        name  = "EXTRACT_WORKER_PORT"
        value = "3004"
      },
      {
        name  = "WORKER_PORT"
        value = "3005"
      },
      {
        name  = "ENV"
        value = "local"
      },
      {
        name  = "REDIS_URL"
        value = "redis://${data.terraform_remote_state.db_storage.outputs.redis_endpoint}"
      },
      {
        name  = "REDIS_RATE_LIMIT_URL"
        value = "redis://${data.terraform_remote_state.db_storage.outputs.redis_endpoint}"
      },
      {
        name  = "PLAYWRIGHT_MICROSERVICE_URL"
        value = "http://firecrawl-playwright.${var.aws_project_name}.local:8080/scrape"
      },
      {
        name  = "NUQ_DATABASE_URL"
        value = "postgresql://postgres@${data.terraform_remote_state.db_storage.outputs.db_instance_address}:5432/postgres"
      }
    ]
    secrets = [
      {
        name      = "PGPASSWORD"
        valueFrom = data.terraform_remote_state.db_storage.outputs.db_password_secret_arn
      }
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.firecrawl_api.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
    ulimits = [
      {
        name      = "nofile"
        softLimit = 65535
        hardLimit = 65535
      }
    ]
  }])

  tags = {
    Name = "${var.aws_project_name}-firecrawl-api-task"
  }
}

# Firecrawl Playwright Task Definition
resource "aws_ecs_task_definition" "firecrawl_playwright" {
  family                   = "${var.aws_project_name}-firecrawl-playwright"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "1024"
  memory                   = "2048"
  execution_role_arn       = data.terraform_remote_state.db_storage.outputs.ecs_task_execution_role_arn
  task_role_arn            = aws_iam_role.firecrawl_playwright_task.arn

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "ARM64"
  }

  container_definitions = jsonencode([{
    name  = "firecrawl-playwright"
    image = "${data.terraform_remote_state.repository.outputs.ecr_repository_firecrawl_playwright}:latest"
    portMappings = [{
      containerPort = 8080
      protocol      = "tcp"
    }]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.firecrawl_playwright.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
    ulimits = [
      {
        name      = "nofile"
        softLimit = 65535
        hardLimit = 65535
      }
    ]
  }])

  tags = {
    Name = "${var.aws_project_name}-firecrawl-playwright-task"
  }
}

# Firecrawl API ECS Service (Internal only - no load balancer)
resource "aws_ecs_service" "firecrawl_api" {
  name            = "firecrawl-api"
  cluster         = data.terraform_remote_state.db_storage.outputs.ecs_cluster_id
  task_definition = aws_ecs_task_definition.firecrawl_api.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = data.terraform_remote_state.db_storage.outputs.private_subnet_ids
    security_groups  = [aws_security_group.firecrawl_services.id]
    assign_public_ip = false
  }

  service_registries {
    registry_arn = aws_service_discovery_service.firecrawl_api.arn
  }

  depends_on = [aws_ecs_service.firecrawl_playwright]

  tags = {
    Name = "${var.aws_project_name}-firecrawl-api-service"
  }
}

# Firecrawl Playwright ECS Service (Internal only - no load balancer)
resource "aws_ecs_service" "firecrawl_playwright" {
  name            = "firecrawl-playwright"
  cluster         = data.terraform_remote_state.db_storage.outputs.ecs_cluster_id
  task_definition = aws_ecs_task_definition.firecrawl_playwright.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = data.terraform_remote_state.db_storage.outputs.private_subnet_ids
    security_groups  = [aws_security_group.firecrawl_services.id]
    assign_public_ip = false
  }

  service_registries {
    registry_arn = aws_service_discovery_service.firecrawl_playwright.arn
  }

  tags = {
    Name = "${var.aws_project_name}-firecrawl-playwright-service"
  }
}
