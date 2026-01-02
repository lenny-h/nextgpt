# ==============================================================================
# Firecrawl Services
# ==============================================================================

# CloudWatch Log Groups for Firecrawl
resource "aws_cloudwatch_log_group" "firecrawl_api" {
  name              = "/ecs/${var.aws_project_name}/firecrawl-api"
  retention_in_days = 1

  tags = {
    Name = "${var.aws_project_name}-firecrawl-api-logs"
  }
}

resource "aws_cloudwatch_log_group" "firecrawl_playwright" {
  name              = "/ecs/${var.aws_project_name}/firecrawl-playwright"
  retention_in_days = 1

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
        name  = "PORT"
        value = "8080"
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
        value = "production"
      },
      {
        name  = "LOGGING_LEVEL"
        value = "error"
      },
      {
        name  = "FIRECRAWL_LOGGING_LEVEL"
        value = "error"
      },
      {
        name  = "MAX_CPU"
        value = "0.95"
      },
      {
        name  = "MAX_RAM"
        value = "0.95"
      },
      {
        name  = "SYS_INFO_MAX_CACHE_DURATION"
        value = "1500"
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
    environment = [
      {
        name  = "PORT"
        value = "8080"
      }
    ]
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
  desired_count   = 0
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
  desired_count   = 0
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

# Autoscaling for Firecrawl API Service
resource "aws_appautoscaling_target" "firecrawl_api" {
  max_capacity       = 5
  min_capacity       = 1
  resource_id        = "service/${data.terraform_remote_state.db_storage.outputs.ecs_cluster_name}/${aws_ecs_service.firecrawl_api.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "firecrawl_api_cpu" {
  name               = "${var.aws_project_name}-firecrawl-api-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.firecrawl_api.resource_id
  scalable_dimension = aws_appautoscaling_target.firecrawl_api.scalable_dimension
  service_namespace  = aws_appautoscaling_target.firecrawl_api.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 85.0
    scale_in_cooldown  = 200
    scale_out_cooldown = 90
  }
}

resource "aws_appautoscaling_policy" "firecrawl_api_memory" {
  name               = "${var.aws_project_name}-firecrawl-api-memory-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.firecrawl_api.resource_id
  scalable_dimension = aws_appautoscaling_target.firecrawl_api.scalable_dimension
  service_namespace  = aws_appautoscaling_target.firecrawl_api.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value       = 85.0
    scale_in_cooldown  = 200
    scale_out_cooldown = 90
  }
}

# Autoscaling for Firecrawl Playwright Service
resource "aws_appautoscaling_target" "firecrawl_playwright" {
  max_capacity       = 5
  min_capacity       = 1
  resource_id        = "service/${data.terraform_remote_state.db_storage.outputs.ecs_cluster_name}/${aws_ecs_service.firecrawl_playwright.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "firecrawl_playwright_cpu" {
  name               = "${var.aws_project_name}-firecrawl-playwright-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.firecrawl_playwright.resource_id
  scalable_dimension = aws_appautoscaling_target.firecrawl_playwright.scalable_dimension
  service_namespace  = aws_appautoscaling_target.firecrawl_playwright.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 85.0
    scale_in_cooldown  = 200
    scale_out_cooldown = 90
  }
}

resource "aws_appautoscaling_policy" "firecrawl_playwright_memory" {
  name               = "${var.aws_project_name}-firecrawl-playwright-memory-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.firecrawl_playwright.resource_id
  scalable_dimension = aws_appautoscaling_target.firecrawl_playwright.scalable_dimension
  service_namespace  = aws_appautoscaling_target.firecrawl_playwright.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value       = 85.0
    scale_in_cooldown  = 200
    scale_out_cooldown = 90
  }
}
