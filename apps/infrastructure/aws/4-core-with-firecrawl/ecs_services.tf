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

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "ARM64"
  }

  container_definitions = jsonencode([{
    name  = "api"
    image = "${data.terraform_remote_state.repository.outputs.ecr_repository_api}:latest"
    portMappings = [{
      containerPort = 8080
      protocol      = "tcp"
    }]
    environment = concat(
      [
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
          name  = "ENABLE_SSO"
          value = tostring(var.enable_sso)
        },
        {
          name  = "RESEND_SENDER_EMAIL"
          value = var.resend_sender_email
        },
        {
          name  = "SITE_URL"
          value = var.site_url
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
          name  = "AWS_SCHEDULER_GROUP"
          value = aws_scheduler_schedule_group.tasks.name
        },
        {
          name  = "AWS_SCHEDULER_ROLE_ARN"
          value = aws_iam_role.eventbridge_scheduler.arn
        },
        {
          name  = "AWS_API_DESTINATION_PROCESS_PDF_ARN"
          value = aws_cloudwatch_event_api_destination.process_pdf.arn
        },
        {
          name  = "AWS_API_DESTINATION_PROCESS_DOCUMENT_ARN"
          value = aws_cloudwatch_event_api_destination.process_document.arn
        },
        {
          name  = "EMBEDDINGS_MODEL"
          value = var.embeddings_model
        },
        {
          name  = "EMBEDDING_DIMENSIONS"
          value = tostring(data.terraform_remote_state.db_storage.outputs.embedding_dimensions)
        },
        {
          name  = "LLM_MODELS"
          value = var.llm_models
        },
        {
          name  = "USE_FIRECRAWL"
          value = "true"
        },
        {
          name  = "FIRECRAWL_API_URL"
          value = "http://firecrawl-api.${var.aws_project_name}.local:8080"
        }
      ],
      var.enable_oauth_login ? [
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
        }
      ] : [],
      var.enable_sso ? [
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
        }
      ] : [],
      var.use_cloudflare_r2 ? [
        {
          name  = "R2_ENDPOINT"
          value = var.r2_endpoint
        }
      ] : []
    )
    secrets = concat(
      [
        {
          name      = "BETTER_AUTH_SECRET"
          valueFrom = aws_secretsmanager_secret.better_auth_secret.arn
        },
        {
          name      = "RESEND_API_KEY"
          valueFrom = aws_secretsmanager_secret.resend_api_key.arn
        },
        {
          name      = "DATABASE_PASSWORD"
          valueFrom = data.terraform_remote_state.db_storage.outputs.db_password_secret_arn
        },
        {
          name      = "ENCRYPTION_KEY"
          valueFrom = aws_secretsmanager_secret.encryption_key.arn
        },
      ],
      var.enable_oauth_login ? [
        {
          name      = "GOOGLE_CLIENT_SECRET"
          valueFrom = aws_secretsmanager_secret.google_client_secret[0].arn
        },
        {
          name      = "GITHUB_CLIENT_SECRET"
          valueFrom = aws_secretsmanager_secret.github_client_secret[0].arn
        },
        {
          name      = "GITLAB_CLIENT_SECRET"
          valueFrom = aws_secretsmanager_secret.gitlab_client_secret[0].arn
        }
      ] : [],
      var.enable_sso ? [
        {
          name      = "SSO_CLIENT_SECRET"
          valueFrom = aws_secretsmanager_secret.sso_client_secret[0].arn
        }
      ] : [],
      var.use_cloudflare_r2 ? [
        {
          name      = "CLOUDFLARE_ACCESS_KEY_ID"
          valueFrom = aws_secretsmanager_secret.cloudflare_r2_access_key_id[0].arn
        },
        {
          name      = "CLOUDFLARE_SECRET_ACCESS_KEY"
          valueFrom = aws_secretsmanager_secret.cloudflare_r2_secret_access_key[0].arn
        }
      ] : []
    )
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

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "ARM64"
  }

  container_definitions = jsonencode([{
    name  = "document-processor"
    image = "${data.terraform_remote_state.repository.outputs.ecr_repository_document_processor}:latest"
    portMappings = [{
      containerPort = 8080
      protocol      = "tcp"
    }]
    environment = concat(
      [
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
      ],
      var.use_cloudflare_r2 ? [
        {
          name  = "R2_ENDPOINT"
          value = var.r2_endpoint
        }
      ] : []
    )
    secrets = concat(
      [
        {
          name      = "DATABASE_PASSWORD"
          valueFrom = data.terraform_remote_state.db_storage.outputs.db_password_secret_arn
        },
        {
          name      = "ENCRYPTION_KEY"
          valueFrom = aws_secretsmanager_secret.encryption_key.arn
        }
      ],
      var.use_cloudflare_r2 ? [
        {
          name      = "CLOUDFLARE_ACCESS_KEY_ID"
          valueFrom = aws_secretsmanager_secret.cloudflare_r2_access_key_id[0].arn
        },
        {
          name      = "CLOUDFLARE_SECRET_ACCESS_KEY"
          valueFrom = aws_secretsmanager_secret.cloudflare_r2_secret_access_key[0].arn
        }
      ] : []
    )
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

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "ARM64"
  }

  container_definitions = jsonencode([{
    name  = "pdf-exporter"
    image = "${data.terraform_remote_state.repository.outputs.ecr_repository_pdf_exporter}:latest"
    portMappings = [{
      containerPort = 8080
      protocol      = "tcp"
    }]
    environment = concat(
      [
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
          name  = "ENABLE_SSO"
          value = tostring(var.enable_sso)
        },
        {
          name  = "SITE_URL"
          value = var.site_url
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
          name  = "DATABASE_HOST"
          value = data.terraform_remote_state.db_storage.outputs.db_instance_endpoint
        },
        {
          name  = "REDIS_URL"
          value = "redis://${data.terraform_remote_state.db_storage.outputs.redis_endpoint}"
        }
      ],
      var.enable_oauth_login ? [
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
        }
      ] : [],
      var.enable_sso ? [
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
        }
      ] : []
    )
    secrets = concat(
      [
        {
          name      = "BETTER_AUTH_SECRET"
          valueFrom = aws_secretsmanager_secret.better_auth_secret.arn
        },
        {
          name      = "DATABASE_PASSWORD"
          valueFrom = data.terraform_remote_state.db_storage.outputs.db_password_secret_arn
        }
      ],
      var.enable_oauth_login ? [
        {
          name      = "GOOGLE_CLIENT_SECRET"
          valueFrom = aws_secretsmanager_secret.google_client_secret[0].arn
        },
        {
          name      = "GITHUB_CLIENT_SECRET"
          valueFrom = aws_secretsmanager_secret.github_client_secret[0].arn
        },
        {
          name      = "GITLAB_CLIENT_SECRET"
          valueFrom = aws_secretsmanager_secret.gitlab_client_secret[0].arn
        }
      ] : [],
      var.enable_sso ? [
        {
          name      = "SSO_CLIENT_SECRET"
          valueFrom = aws_secretsmanager_secret.sso_client_secret[0].arn
        }
      ] : []
    )
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
