# Enable Cloud Run API
resource "google_project_service" "run" {
  project = var.google_vertex_project
  service = "run.googleapis.com"
}

# Enable Vertex AI API
resource "google_project_service" "aiplatform" {
  project = var.google_vertex_project
  service = "aiplatform.googleapis.com"
}

# Enable IAM Credentials API (needed for signing URLs)
resource "google_project_service" "iamcredentials" {
  project = var.google_vertex_project
  service = "iamcredentials.googleapis.com"
}

# API Service
resource "google_cloud_run_v2_service" "api" {
  name                = "api"
  project             = var.google_vertex_project
  location            = var.google_vertex_location
  deletion_protection = false
  ingress             = "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER"

  template {
    service_account = google_service_account.api_sa.email

    containers {
      image = "${var.google_vertex_location}-docker.pkg.dev/${var.google_vertex_project}/app-artifact-repository/api:latest"
      ports {
        container_port = 8080
      }

      # Non-sensitive environment variables
      env {
        name  = "NODE_ENV"
        value = "production"
      }
      env {
        name  = "BETTER_AUTH_URL"
        value = "https://api.${var.site_url}"
      }
      env {
        name  = "ONLY_ALLOW_ADMIN_TO_CREATE_BUCKETS"
        value = tostring(var.only_allow_admin_to_create_buckets)
      }
      env {
        name  = "ADMIN_USER_IDS"
        value = var.admin_user_ids
      }
      env {
        name  = "ENABLE_EMAIL_SIGNUP"
        value = tostring(var.enable_email_signup)
      }
      env {
        name  = "ALLOWED_EMAIL_DOMAINS"
        value = var.allowed_email_domains
      }
      env {
        name  = "ENABLE_OAUTH_LOGIN"
        value = tostring(var.enable_oauth_login)
      }
      dynamic "env" {
        for_each = var.enable_oauth_login ? {
          "GOOGLE_CLIENT_ID" = var.google_client_id
          "GITHUB_CLIENT_ID" = var.github_client_id
          "GITLAB_CLIENT_ID" = var.gitlab_client_id
        } : {}
        content {
          name  = env.key
          value = env.value
        }
      }
      env {
        name  = "ENABLE_SSO"
        value = tostring(var.enable_sso)
      }
      dynamic "env" {
        for_each = var.enable_sso ? {
          "SSO_DOMAIN"                 = var.sso_domain
          "SSO_PROVIDER_ID"            = var.sso_provider_id
          "SSO_CLIENT_ID"              = var.sso_client_id
          "SSO_ISSUER"                 = var.sso_issuer
          "SSO_AUTHORIZATION_ENDPOINT" = var.sso_authorization_endpoint
          "SSO_DISCOVERY_ENDPOINT"     = var.sso_discovery_endpoint
          "SSO_TOKEN_ENDPOINT"         = var.sso_token_endpoint
          "SSO_JWKS_ENDPOINT"          = var.sso_jwks_endpoint
        } : {}
        content {
          name  = env.key
          value = env.value
        }
      }
      env {
        name  = "RESEND_SENDER_EMAIL"
        value = var.resend_sender_email
      }
      env {
        name  = "SITE_URL"
        value = var.site_url
      }
      env {
        name  = "BASE_URL"
        value = "https://app.${var.site_url}"
      }
      env {
        name  = "ALLOWED_ORIGINS"
        value = "https://app.${var.site_url},https://dashboard.${var.site_url}"
      }
      env {
        name  = "DOCUMENT_PROCESSOR_URL"
        value = google_cloud_run_v2_service.document_processor.uri
      }
      env {
        name  = "DATABASE_HOST"
        value = data.terraform_remote_state.db_storage.outputs.postgres_private_ip
      }
      env {
        name  = "REDIS_URL"
        value = data.terraform_remote_state.db_storage.outputs.redis_url
      }
      env {
        name  = "USE_CLOUDFLARE_R2"
        value = tostring(var.use_cloudflare_r2)
      }
      dynamic "env" {
        for_each = var.use_cloudflare_r2 ? {
          "R2_ENDPOINT" = var.r2_endpoint
        } : {}
        content {
          name  = env.key
          value = env.value
        }
      }
      env {
        name  = "CLOUD_PROVIDER"
        value = "gcloud"
      }
      env {
        name  = "GOOGLE_VERTEX_PROJECT"
        value = var.google_vertex_project
      }
      env {
        name  = "GOOGLE_VERTEX_LOCATION"
        value = var.google_vertex_location
      }
      env {
        name  = "GOOGLE_PROCESSING_QUEUE"
        value = google_cloud_tasks_queue.document_processing_queue.name
      }
      env {
        name  = "EMBEDDINGS_MODEL"
        value = var.embeddings_model
      }
      env {
        name  = "EMBEDDING_DIMENSIONS"
        value = tostring(data.terraform_remote_state.db_storage.outputs.embedding_dimensions)
      }
      env {
        name  = "LLM_MODELS"
        value = var.llm_models
      }
      env {
        name  = "USE_FIRECRAWL"
        value = var.use_firecrawl
      }

      # Sensitive secrets from Secret Manager
      env {
        name = "BETTER_AUTH_SECRET"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.better_auth_secret.secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "RESEND_API_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.resend_api_key.secret_id
            version = "latest"
          }
        }
      }
      dynamic "env" {
        for_each = var.enable_oauth_login ? {
          "GOOGLE_CLIENT_SECRET" = google_secret_manager_secret.google_client_secret[0].secret_id
          "GITHUB_CLIENT_SECRET" = google_secret_manager_secret.github_client_secret[0].secret_id
          "GITLAB_CLIENT_SECRET" = google_secret_manager_secret.gitlab_client_secret[0].secret_id
        } : {}
        content {
          name = env.key
          value_source {
            secret_key_ref {
              secret  = env.value
              version = "latest"
            }
          }
        }
      }
      dynamic "env" {
        for_each = var.enable_sso ? {
          "SSO_CLIENT_SECRET" = google_secret_manager_secret.sso_client_secret[0].secret_id
        } : {}
        content {
          name = env.key
          value_source {
            secret_key_ref {
              secret  = env.value
              version = "latest"
            }
          }
        }
      }
      env {
        name = "DATABASE_PASSWORD"
        value_source {
          secret_key_ref {
            secret  = data.terraform_remote_state.db_storage.outputs.db_password_secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "ENCRYPTION_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.encryption_key.secret_id
            version = "latest"
          }
        }
      }
      dynamic "env" {
        for_each = var.use_cloudflare_r2 ? {
          "CLOUDFLARE_ACCESS_KEY_ID"     = google_secret_manager_secret.cloudflare_r2_access_key_id[0].secret_id
          "CLOUDFLARE_SECRET_ACCESS_KEY" = google_secret_manager_secret.cloudflare_r2_secret_access_key[0].secret_id
        } : {}
        content {
          name = env.key
          value_source {
            secret_key_ref {
              secret  = env.value
              version = "latest"
            }
          }
        }
      }
      dynamic "env" {
        for_each = var.use_firecrawl ? {
          "FIRECRAWL_API_KEY" = google_secret_manager_secret.firecrawl_api_key[0].secret_id
        } : {}
        content {
          name = env.key
          value_source {
            secret_key_ref {
              secret  = env.value
              version = "latest"
            }
          }
        }
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }
    }

    vpc_access {
      network_interfaces {
        network    = data.terraform_remote_state.db_storage.outputs.vpc_network_id
        subnetwork = data.terraform_remote_state.db_storage.outputs.subnet_id
      }
    }

    scaling {
      min_instance_count = 0
      max_instance_count = 5
    }

    max_instance_request_concurrency = 30
    timeout                          = "60s"
  }

  traffic {
    percent = 100
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
    ]
  }

  depends_on = [
    google_project_service.run,
    google_service_account.api_sa,
    google_cloud_tasks_queue.document_processing_queue,
    google_secret_manager_secret_version.better_auth_secret,
    google_secret_manager_secret_version.resend_api_key,
    google_secret_manager_secret_version.encryption_key
  ]
}

# Document Processor Service
resource "google_cloud_run_v2_service" "document_processor" {
  name                = "document-processor"
  project             = var.google_vertex_project
  location            = var.google_vertex_location
  deletion_protection = false
  ingress             = "INGRESS_TRAFFIC_INTERNAL_ONLY"

  template {
    service_account = google_service_account.document_processor_sa.email

    containers {
      image = "${var.google_vertex_location}-docker.pkg.dev/${var.google_vertex_project}/app-artifact-repository/document-processor:latest"
      ports {
        container_port = 8080
      }

      # Non-sensitive environment variables
      env {
        name  = "ENVIRONMENT"
        value = "production"
      }
      env {
        name  = "API_URL"
        value = "https://api.${var.site_url}"
      }
      env {
        name  = "DATABASE_HOST"
        value = data.terraform_remote_state.db_storage.outputs.postgres_private_ip
      }
      env {
        name  = "USE_CLOUDFLARE_R2"
        value = tostring(var.use_cloudflare_r2)
      }
      dynamic "env" {
        for_each = var.use_cloudflare_r2 ? {
          "R2_ENDPOINT" = var.r2_endpoint
        } : {}
        content {
          name  = env.key
          value = env.value
        }
      }
      env {
        name  = "CLOUD_PROVIDER"
        value = "gcloud"
      }
      env {
        name  = "GOOGLE_VERTEX_PROJECT"
        value = var.google_vertex_project
      }
      env {
        name  = "GOOGLE_VERTEX_LOCATION"
        value = var.google_vertex_location
      }

      # Sensitive secrets from Secret Manager
      env {
        name = "DATABASE_PASSWORD"
        value_source {
          secret_key_ref {
            secret  = data.terraform_remote_state.db_storage.outputs.db_password_secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "ENCRYPTION_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.encryption_key.secret_id
            version = "latest"
          }
        }
      }
      dynamic "env" {
        for_each = var.use_cloudflare_r2 ? {
          "CLOUDFLARE_ACCESS_KEY_ID"     = google_secret_manager_secret.cloudflare_r2_access_key_id[0].secret_id
          "CLOUDFLARE_SECRET_ACCESS_KEY" = google_secret_manager_secret.cloudflare_r2_secret_access_key[0].secret_id
        } : {}
        content {
          name = env.key
          value_source {
            secret_key_ref {
              secret  = env.value
              version = "latest"
            }
          }
        }
      }

      resources {
        limits = {
          cpu    = "4"
          memory = "8Gi"
        }
      }
    }

    vpc_access {
      network_interfaces {
        network    = data.terraform_remote_state.db_storage.outputs.vpc_network_id
        subnetwork = data.terraform_remote_state.db_storage.outputs.subnet_id
      }
    }

    scaling {
      min_instance_count = 0
      max_instance_count = 5
    }

    max_instance_request_concurrency = 30
    timeout                          = "60s"
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
    ]
  }

  depends_on = [
    google_project_service.run,
    google_service_account.document_processor_sa,
    google_secret_manager_secret_version.encryption_key
  ]
}

# PDF Exporter Service
resource "google_cloud_run_v2_service" "pdf_exporter" {
  name                = "pdf-exporter"
  project             = var.google_vertex_project
  location            = var.google_vertex_location
  deletion_protection = false
  ingress             = "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER"

  template {
    service_account = google_service_account.pdf_exporter_sa.email

    containers {
      image = "${var.google_vertex_location}-docker.pkg.dev/${var.google_vertex_project}/app-artifact-repository/pdf-exporter:latest"
      ports {
        container_port = 8080
      }

      # Non-sensitive environment variables
      env {
        name  = "NODE_ENV"
        value = "production"
      }
      env {
        name  = "BETTER_AUTH_URL"
        value = "https://api.${var.site_url}"
      }
      env {
        name  = "ONLY_ALLOW_ADMIN_TO_CREATE_BUCKETS"
        value = tostring(var.only_allow_admin_to_create_buckets)
      }
      env {
        name  = "ADMIN_USER_IDS"
        value = var.admin_user_ids
      }
      env {
        name  = "ENABLE_EMAIL_SIGNUP"
        value = tostring(var.enable_email_signup)
      }
      env {
        name  = "ALLOWED_EMAIL_DOMAINS"
        value = var.allowed_email_domains
      }
      env {
        name  = "ENABLE_OAUTH_LOGIN"
        value = tostring(var.enable_oauth_login)
      }
      dynamic "env" {
        for_each = var.enable_oauth_login ? {
          "GOOGLE_CLIENT_ID" = var.google_client_id
          "GITHUB_CLIENT_ID" = var.github_client_id
          "GITLAB_CLIENT_ID" = var.gitlab_client_id
        } : {}
        content {
          name  = env.key
          value = env.value
        }
      }
      env {
        name  = "ENABLE_SSO"
        value = tostring(var.enable_sso)
      }
      dynamic "env" {
        for_each = var.enable_sso ? {
          "SSO_DOMAIN"                 = var.sso_domain
          "SSO_PROVIDER_ID"            = var.sso_provider_id
          "SSO_CLIENT_ID"              = var.sso_client_id
          "SSO_ISSUER"                 = var.sso_issuer
          "SSO_AUTHORIZATION_ENDPOINT" = var.sso_authorization_endpoint
          "SSO_DISCOVERY_ENDPOINT"     = var.sso_discovery_endpoint
          "SSO_TOKEN_ENDPOINT"         = var.sso_token_endpoint
          "SSO_JWKS_ENDPOINT"          = var.sso_jwks_endpoint
        } : {}
        content {
          name  = env.key
          value = env.value
        }
      }
      env {
        name  = "SITE_URL"
        value = var.site_url
      }
      env {
        name  = "BASE_URL"
        value = "https://app.${var.site_url}"
      }
      env {
        name  = "ALLOWED_ORIGINS"
        value = "https://app.${var.site_url},https://dashboard.${var.site_url}"
      }
      env {
        name  = "DATABASE_HOST"
        value = data.terraform_remote_state.db_storage.outputs.postgres_private_ip
      }
      env {
        name  = "REDIS_URL"
        value = data.terraform_remote_state.db_storage.outputs.redis_url
      }
      # Sensitive secrets from Secret Manager
      env {
        name = "BETTER_AUTH_SECRET"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.better_auth_secret.secret_id
            version = "latest"
          }
        }
      }
      dynamic "env" {
        for_each = var.enable_oauth_login ? {
          "GOOGLE_CLIENT_SECRET" = google_secret_manager_secret.google_client_secret[0].secret_id
          "GITHUB_CLIENT_SECRET" = google_secret_manager_secret.github_client_secret[0].secret_id
          "GITLAB_CLIENT_SECRET" = google_secret_manager_secret.gitlab_client_secret[0].secret_id
        } : {}
        content {
          name = env.key
          value_source {
            secret_key_ref {
              secret  = env.value
              version = "latest"
            }
          }
        }
      }
      dynamic "env" {
        for_each = var.enable_sso ? {
          "SSO_CLIENT_SECRET" = google_secret_manager_secret.sso_client_secret[0].secret_id
        } : {}
        content {
          name = env.key
          value_source {
            secret_key_ref {
              secret  = env.value
              version = "latest"
            }
          }
        }
      }
      env {
        name = "DATABASE_PASSWORD"
        value_source {
          secret_key_ref {
            secret  = data.terraform_remote_state.db_storage.outputs.db_password_secret_id
            version = "latest"
          }
        }
      }

      resources {
        limits = {
          cpu    = "2"
          memory = "4Gi"
        }
      }
    }

    max_instance_request_concurrency = 10
    timeout                          = "60s"

    scaling {
      min_instance_count = 0
      max_instance_count = 5
    }

    vpc_access {
      network_interfaces {
        network    = data.terraform_remote_state.db_storage.outputs.vpc_network_id
        subnetwork = data.terraform_remote_state.db_storage.outputs.subnet_id
      }
    }
  }

  traffic {
    percent = 100
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
    ]
  }

  depends_on = [
    google_project_service.run,
    google_service_account.pdf_exporter_sa,
    google_secret_manager_secret_version.better_auth_secret
  ]
}

# Allow the document processor service account to be invoked by Cloud Tasks
resource "google_cloud_run_v2_service_iam_member" "document_processor_invoker_tasks" {
  name     = google_cloud_run_v2_service.document_processor.name
  location = google_cloud_run_v2_service.document_processor.location
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.cloud_tasks_sa.email}"
}

# Allow the document processor to be invoked by API service
resource "google_cloud_run_v2_service_iam_member" "document_processor_invoker_api" {
  name     = google_cloud_run_v2_service.document_processor.name
  location = google_cloud_run_v2_service.document_processor.location
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.api_sa.email}"
}
