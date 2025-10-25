# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "${var.aws_project_name}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "${var.aws_project_name}-cluster"
  }
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "api" {
  name              = "/ecs/${var.aws_project_name}/api"
  retention_in_days = 7

  tags = {
    Name = "${var.aws_project_name}-api-logs"
  }
}

resource "aws_cloudwatch_log_group" "document_processor" {
  name              = "/ecs/${var.aws_project_name}/document-processor"
  retention_in_days = 7

  tags = {
    Name = "${var.aws_project_name}-document-processor-logs"
  }
}

resource "aws_cloudwatch_log_group" "pdf_exporter" {
  name              = "/ecs/${var.aws_project_name}/pdf-exporter"
  retention_in_days = 7

  tags = {
    Name = "${var.aws_project_name}-pdf-exporter-logs"
  }
}

# API Task Definition
resource "aws_ecs_task_definition" "api" {
  family                   = "${var.aws_project_name}-api"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.api_task.arn

  container_definitions = jsonencode([{
    name  = "api"
    image = "${aws_ecr_repository.api.repository_url}:latest"
    portMappings = [{
      containerPort = 8080
      protocol      = "tcp"
    }]
    environment = [
      {
        name  = "BASE_URL"
        value = "https://app.${var.site_url}"
      },
      {
        name  = "ALLOWED_ORIGINS"
        value = "https://app.${var.site_url},https://dashboard.${var.site_url}"
      },
      {
        name  = "DOCUMENT_PROCESSOR_URL"
        value = "http://${aws_lb_target_group.document_processor.dns_name}"
      },
      {
        name  = "BETTER_AUTH_URL"
        value = "https://api.${var.site_url}"
      },
      {
        name  = "ENABLE_EMAIL_SIGNUP"
        value = var.enable_email_signup
      },
      {
        name  = "ALLOWED_EMAIL_DOMAINS"
        value = var.allowed_email_domains
      },
      {
        name  = "RESEND_SENDER_EMAIL"
        value = var.resend_sender_email
      },
      {
        name  = "GOOGLE_CLIENT_ID"
        value = var.google_client_id
      },
      {
        name  = "DATABASE_HOST"
        value = aws_db_instance.postgres.endpoint
      },
      {
        name  = "REDIS_URL"
        value = "redis://${aws_elasticache_cluster.redis.cache_nodes[0].address}:${aws_elasticache_cluster.redis.cache_nodes[0].port}"
      },
      {
        name  = "USE_CLOUDFLARE_R2"
        value = "true"
      },
      {
        name  = "R2_ENDPOINT"
        value = "https://${var.cloudflare_account_id}.r2.cloudflarestorage.com"
      },
      {
        name  = "CLOUD_PROVIDER"
        value = "aws"
      },
      {
        name  = "AWS_PROJECT_NAME"
        value = var.aws_project_name
      },
      {
        name  = "AWS_REGION"
        value = var.aws_region
      },
      # {
      #   name  = "AWS_ACCESS_KEY_ID"
      #   value = var.aws_access_key_id
      # },
      {
        name  = "SQS_QUEUE_URL"
        value = aws_sqs_queue.document_processing.url
      },
      {
        name  = "AWS_SCHEDULER_TARGET_ARN"
        value = aws_sqs_queue.document_processing.arn
      },
      {
        name  = "AWS_SCHEDULER_ROLE_ARN"
        value = aws_iam_role.eventbridge_scheduler.arn
      },
      {
        name  = "AWS_SCHEDULER_GROUP"
        value = aws_scheduler_schedule_group.tasks.name
      },
      {
        name  = "ATTACHMENT_URL_PREFIX"
        value = "https://${aws_s3_bucket.temporary_files.bucket}.s3.${var.aws_region}.amazonaws.com"
      },
      {
        name  = "EMBEDDINGS_MODEL"
        value = var.embeddings_model
      },
      {
        name  = "LLM_MODELS"
        value = var.llm_models
      }
    ]
    secrets = [
      {
        name      = "BETTER_AUTH_SECRET"
        valueFrom = aws_secretsmanager_secret.better_auth_secret.arn
      },
      {
        name      = "RESEND_API_KEY"
        valueFrom = aws_secretsmanager_secret.resend_api_key.arn
      },
      {
        name      = "GOOGLE_CLIENT_SECRET"
        valueFrom = aws_secretsmanager_secret.google_client_secret.arn
      },
      {
        name      = "DATABASE_PASSWORD"
        valueFrom = aws_secretsmanager_secret.db_password.arn
      },
      {
        name      = "ENCRYPTION_KEY"
        valueFrom = aws_secretsmanager_secret.encryption_key.arn
      },
      {
        name      = "CLOUDFLARE_ACCESS_KEY_ID"
        valueFrom = aws_secretsmanager_secret.cloudflare_r2_access_key_id.arn
      },
      {
        name      = "CLOUDFLARE_SECRET_ACCESS_KEY"
        valueFrom = aws_secretsmanager_secret.cloudflare_r2_secret_access_key.arn
      },
      # {
      #   name  = "AWS_SECRET_ACCESS_KEY"
      #   value = aws_secretsmanager_secret.aws_secret_access_key.arn
      # },
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.api.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])

  tags = {
    Name = "${var.aws_project_name}-api-task"
  }
}

# Document Processor Task Definition
resource "aws_ecs_task_definition" "document_processor" {
  family                   = "${var.aws_project_name}-document-processor"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.document_processor_task.arn

  container_definitions = jsonencode([{
    name  = "document-processor"
    image = "${aws_ecr_repository.document_processor.repository_url}:latest"
    portMappings = [{
      containerPort = 8080
      protocol      = "tcp"
    }]
    environment = [
      {
        name  = "DATABASE_HOST"
        value = aws_db_instance.postgres.endpoint
      },
      {
        name  = "USE_CLOUDFLARE_R2"
        value = "true"
      },
      {
        name  = "R2_ENDPOINT"
        value = "https://${var.cloudflare_account_id}.r2.cloudflarestorage.com"
      },
      {
        name  = "CLOUD_PROVIDER"
        value = "aws"
      },
      {
        name  = "AWS_PROJECT_NAME"
        value = var.aws_project_name
      },
      {
        name  = "AWS_REGION"
        value = var.aws_region
      },
      {
        name  = "EMBEDDINGS_MODEL"
        value = var.embeddings_model
      }
    ]
    secrets = [
      {
        name      = "DATABASE_PASSWORD"
        valueFrom = aws_secretsmanager_secret.db_password.arn
      },
      {
        name      = "ENCRYPTION_KEY"
        valueFrom = aws_secretsmanager_secret.encryption_key.arn
      },
      {
        name      = "CLOUDFLARE_ACCESS_KEY_ID"
        valueFrom = aws_secretsmanager_secret.cloudflare_r2_access_key_id.arn
      },
      {
        name      = "CLOUDFLARE_SECRET_ACCESS_KEY"
        valueFrom = aws_secretsmanager_secret.cloudflare_r2_secret_access_key.arn
      }
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.document_processor.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])

  tags = {
    Name = "${var.aws_project_name}-document-processor-task"
  }
}

# PDF Exporter Task Definition
resource "aws_ecs_task_definition" "pdf_exporter" {
  family                   = "${var.aws_project_name}-pdf-exporter"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.pdf_exporter_task.arn

  container_definitions = jsonencode([{
    name  = "pdf-exporter"
    image = "${aws_ecr_repository.pdf_exporter.repository_url}:latest"
    portMappings = [{
      containerPort = 8080
      protocol      = "tcp"
    }]
    environment = [
      {
        name  = "ALLOWED_ORIGINS"
        value = "https://app.${var.site_url},https://dashboard.${var.site_url}"
      }
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.pdf_exporter.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])

  tags = {
    Name = "${var.aws_project_name}-pdf-exporter-task"
  }
}

# API ECS Service
resource "aws_ecs_service" "api" {
  name            = "api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = 8080
  }

  depends_on = [aws_lb_listener.https]

  tags = {
    Name = "${var.aws_project_name}-api-service"
  }
}

# Document Processor ECS Service
resource "aws_ecs_service" "document_processor" {
  name            = "document-processor"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.document_processor.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.document_processor.arn
    container_name   = "document-processor"
    container_port   = 8080
  }

  depends_on = [aws_lb_listener.https]

  tags = {
    Name = "${var.aws_project_name}-document-processor-service"
  }
}

# PDF Exporter ECS Service
resource "aws_ecs_service" "pdf_exporter" {
  name            = "pdf-exporter"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.pdf_exporter.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.pdf_exporter.arn
    container_name   = "pdf-exporter"
    container_port   = 8080
  }

  depends_on = [aws_lb_listener.https]

  tags = {
    Name = "${var.aws_project_name}-pdf-exporter-service"
  }
}
