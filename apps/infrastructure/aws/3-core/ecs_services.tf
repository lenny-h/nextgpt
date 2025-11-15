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
  execution_role_arn       = data.terraform_remote_state.db_storage.outputs.ecs_task_execution_role_arn
  task_role_arn            = aws_iam_role.api_task.arn

  container_definitions = jsonencode([{
    name  = "api"
    image = "${data.terraform_remote_state.repository.outputs.ecr_repository_api}:latest"
    portMappings = [{
      containerPort = 8080
      protocol      = "tcp"
    }]
    environment = [
      {
        name  = "NODE_ENV"
        value = "production"
      },
      {
        name  = "BETTER_AUTH_URL"
        value = "https://api.${var.site_url}"
      },
      {
        name  = "ONLY_ALLOW_ADMIN_TO_CREATE_BUCKETS"
        value = tostring(var.only_allow_admin_to_create_buckets)
      },
      {
        name  = "ADMIN_USER_IDS"
        value = var.admin_user_ids
      },
      {
        name  = "ENABLE_EMAIL_SIGNUP"
        value = tostring(var.enable_email_signup)
      },
      {
        name  = "ALLOWED_EMAIL_DOMAINS"
        value = var.allowed_email_domains
      },
      {
        name  = "ENABLE_OAUTH_LOGIN"
        value = tostring(var.enable_oauth_login)
      },
      {
        name  = "GOOGLE_CLIENT_ID"
        value = var.google_client_id
      },
      {
        name  = "GITHUB_CLIENT_ID"
        value = var.github_client_id
      },
      {
        name  = "GITLAB_CLIENT_ID"
        value = var.gitlab_client_id
      },
      {
        name  = "ENABLE_SSO"
        value = tostring(var.enable_sso)
      },
      {
        name  = "SSO_DOMAIN"
        value = var.sso_domain
      },
      {
        name  = "SSO_PROVIDER_ID"
        value = var.sso_provider_id
      },
      {
        name  = "SSO_CLIENT_ID"
        value = var.sso_client_id
      },
      {
        name  = "SSO_ISSUER"
        value = var.sso_issuer
      },
      {
        name  = "SSO_AUTHORIZATION_ENDPOINT"
        value = var.sso_authorization_endpoint
      },
      {
        name  = "SSO_DISCOVERY_ENDPOINT"
        value = var.sso_discovery_endpoint
      },
      {
        name  = "SSO_TOKEN_ENDPOINT"
        value = var.sso_token_endpoint
      },
      {
        name  = "SSO_JWKS_ENDPOINT"
        value = var.sso_jwks_endpoint
      },
      {
        name  = "RESEND_SENDER_EMAIL"
        value = var.resend_sender_email
      },
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
        value = "http://document-processor.${var.aws_project_name}.local:8080"
      },
      {
        name  = "DATABASE_HOST"
        value = data.terraform_remote_state.db_storage.outputs.db_instance_endpoint
      },
      {
        name  = "REDIS_URL"
        value = "redis://${data.terraform_remote_state.db_storage.outputs.redis_endpoint}"
      },
      {
        name  = "USE_CLOUDFLARE_R2"
        value = tostring(var.use_cloudflare_r2)
      },
      {
        name  = "R2_ENDPOINT"
        value = var.r2_endpoint
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
        name  = "SQS_QUEUE_URL"
        value = aws_sqs_queue.document_processing.url
      },
      {
        name  = "AWS_SCHEDULER_GROUP"
        value = aws_scheduler_schedule_group.tasks.name
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
        name  = "EMBEDDINGS_MODEL"
        value = var.embeddings_model
      },
      {
        name  = "LLM_MODELS"
        value = var.llm_models
      },
      {
        name  = "USE_FIRECRAWL"
        value = "false"
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
        name      = "GITHUB_CLIENT_SECRET"
        valueFrom = aws_secretsmanager_secret.github_client_secret.arn
      },
      {
        name      = "GITLAB_CLIENT_SECRET"
        valueFrom = aws_secretsmanager_secret.gitlab_client_secret.arn
      },
      {
        name      = "SSO_CLIENT_SECRET"
        valueFrom = aws_secretsmanager_secret.sso_client_secret.arn
      },
      {
        name      = "DATABASE_PASSWORD"
        valueFrom = data.terraform_remote_state.db_storage.outputs.db_password_secret_arn
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
  execution_role_arn       = data.terraform_remote_state.db_storage.outputs.ecs_task_execution_role_arn
  task_role_arn            = aws_iam_role.document_processor_task.arn

  container_definitions = jsonencode([{
    name  = "document-processor"
    image = "${data.terraform_remote_state.repository.outputs.ecr_repository_document_processor}:latest"
    portMappings = [{
      containerPort = 8080
      protocol      = "tcp"
    }]
    environment = [
      {
        name  = "ENVIRONMENT"
        value = "production"
      },
      {
        name  = "API_URL"
        value = "https://api.${var.site_url}"
      },
      {
        name  = "DATABASE_HOST"
        value = data.terraform_remote_state.db_storage.outputs.db_instance_endpoint
      },
      {
        name  = "USE_CLOUDFLARE_R2"
        value = tostring(var.use_cloudflare_r2)
      },
      {
        name  = "R2_ENDPOINT"
        value = var.r2_endpoint
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
        valueFrom = data.terraform_remote_state.db_storage.outputs.db_password_secret_arn
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
  execution_role_arn       = data.terraform_remote_state.db_storage.outputs.ecs_task_execution_role_arn
  task_role_arn            = aws_iam_role.pdf_exporter_task.arn

  container_definitions = jsonencode([{
    name  = "pdf-exporter"
    image = "${data.terraform_remote_state.repository.outputs.ecr_repository_pdf_exporter}:latest"
    portMappings = [{
      containerPort = 8080
      protocol      = "tcp"
    }]
    environment = [
      {
        name  = "NODE_ENV"
        value = "production"
      },
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
  cluster         = data.terraform_remote_state.db_storage.outputs.ecs_cluster_id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = data.terraform_remote_state.db_storage.outputs.private_subnet_ids
    security_groups  = [data.terraform_remote_state.db_storage.outputs.security_group_ecs_tasks_id]
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

# Document Processor ECS Service (Internal only - no load balancer)
resource "aws_ecs_service" "document_processor" {
  name            = "document-processor"
  cluster         = data.terraform_remote_state.db_storage.outputs.ecs_cluster_id
  task_definition = aws_ecs_task_definition.document_processor.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = data.terraform_remote_state.db_storage.outputs.private_subnet_ids
    security_groups  = [data.terraform_remote_state.db_storage.outputs.security_group_ecs_tasks_id]
    assign_public_ip = false
  }

  service_registries {
    registry_arn = aws_service_discovery_service.document_processor.arn
  }

  tags = {
    Name = "${var.aws_project_name}-document-processor-service"
  }
}

# PDF Exporter ECS Service
resource "aws_ecs_service" "pdf_exporter" {
  name            = "pdf-exporter"
  cluster         = data.terraform_remote_state.db_storage.outputs.ecs_cluster_id
  task_definition = aws_ecs_task_definition.pdf_exporter.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = data.terraform_remote_state.db_storage.outputs.private_subnet_ids
    security_groups  = [data.terraform_remote_state.db_storage.outputs.security_group_ecs_tasks_id]
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
