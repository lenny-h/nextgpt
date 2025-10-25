# API Service
resource "google_cloud_run_v2_service" "api" {
  name     = "api"
  location = var.gcp_region
  project  = var.project_id
  ingress  = "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER"

  template {
    service_account = google_service_account.api_sa.email

    containers {
      image = "${var.gcp_region}-docker.pkg.dev/${var.project_id}/app-artifact-repository/api:latest"
      ports {
        container_port = 8080
      }

      # Non-sensitive environment variables
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
        value = google_cloud_run_v2_service.document_processor.status[0].url
      }
      env {
        name  = "BETTER_AUTH_URL"
        value = "https://api.${var.site_url}"
      }
      env {
        name  = "ENABLE_EMAIL_SIGNUP"
        value = var.enable_email_signup
      }
      env {
        name  = "ALLOWED_EMAIL_DOMAINS"
        value = var.allowed_email_domains
      }
      env {
        name  = "RESEND_SENDER_EMAIL"
        value = var.resend_sender_email
      }
      env {
        name  = "GOOGLE_CLIENT_ID"
        value = var.google_client_id
      }
      env {
        name  = "DATABASE_HOST"
        value = google_sql_database_instance.postgres.private_ip_address
      }
      env {
        name  = "REDIS_URL"
        value = "redis://${google_redis_instance.redis.host}:${google_redis_instance.redis.port}"
      }
      env {
        name  = "USE_CLOUDFLARE_R2"
        value = "true"
      }
      env {
        name  = "R2_ENDPOINT"
        value = "https://${var.cloudflare_account_id}.r2.cloudflarestorage.com"
      }
      env {
        name  = "CLOUD_PROVIDER"
        value = "gcloud"
      }
      env {
        name  = "GOOGLE_VERTEX_PROJECT"
        value = var.project_id
      }
      env {
        name  = "GOOGLE_VERTEX_LOCATION"
        value = var.gcp_region
      }
      env {
        name  = "CLOUD_TASKS_SA"
        value = google_service_account.cloud_tasks_sa.email
      }
      env {
        name  = "TASK_QUEUE_PATH"
        value = "projects/${var.project_id}/locations/${var.gcp_region}/queues/${google_cloud_tasks_queue.document_processing_queue.name}"
      }
      env {
        name  = "ATTACHMENT_URL_PREFIX"
        value = "https://storage.googleapis.com/${var.project_id}-temporary-files-bucket"
      }
      env {
        name  = "EMBEDDINGS_MODEL"
        value = var.embeddings_model
      }
      env {
        name  = "LLM_MODELS"
        value = var.llm_models
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
      env {
        name = "GOOGLE_CLIENT_SECRET"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.google_client_secret.secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "DATABASE_PASSWORD"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.db_password.secret_id
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
      env {
        name = "CLOUDFLARE_ACCESS_KEY_ID"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.cloudflare_r2_access_key_id.secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "CLOUDFLARE_SECRET_ACCESS_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.cloudflare_r2_secret_access_key.secret_id
            version = "latest"
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
        network    = google_compute_network.private_network.id
        subnetwork = google_compute_subnetwork.private_subnet.id
      }
    }

    scaling {
      min_instance_count = 0
      max_instance_count = 5
    }

    max_instance_request_concurrency = 30
    timeout                          = "30s"
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

  depends_on          = [google_project_service.run_api]
  deletion_protection = false
}

# Document Processor Service
resource "google_cloud_run_v2_service" "document_processor" {
  name     = "document-processor"
  location = var.gcp_region
  project  = var.project_id
  ingress  = "INGRESS_TRAFFIC_INTERNAL_ONLY"

  template {
    service_account = google_service_account.document_processor_sa.email

    containers {
      image = "${var.gcp_region}-docker.pkg.dev/${var.project_id}/app-artifact-repository/document-processor:latest"
      ports {
        container_port = 8080
      }

      # Non-sensitive environment variables
      env {
        name  = "DATABASE_HOST"
        value = google_sql_database_instance.postgres.private_ip_address
      }
      env {
        name  = "USE_CLOUDFLARE_R2"
        value = "true"
      }
      env {
        name  = "R2_ENDPOINT"
        value = "https://${var.cloudflare_account_id}.r2.cloudflarestorage.com"
      }
      env {
        name  = "CLOUD_PROVIDER"
        value = "gcloud"
      }
      env {
        name  = "GOOGLE_VERTEX_PROJECT"
        value = var.project_id
      }
      env {
        name  = "GOOGLE_VERTEX_LOCATION"
        value = var.gcp_region
      }
      env {
        name  = "EMBEDDINGS_MODEL"
        value = var.embeddings_model
      }

      # Sensitive secrets from Secret Manager
      env {
        name = "DATABASE_PASSWORD"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.db_password.secret_id
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
      env {
        name = "CLOUDFLARE_ACCESS_KEY_ID"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.cloudflare_r2_access_key_id.secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "CLOUDFLARE_SECRET_ACCESS_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.cloudflare_r2_secret_access_key.secret_id
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

    vpc_access {
      network_interfaces {
        network    = google_compute_network.private_network.id
        subnetwork = google_compute_subnetwork.private_subnet.id
      }
    }

    scaling {
      min_instance_count = 0
      max_instance_count = 5
    }

    max_instance_request_concurrency = 30
    timeout                          = "30s"
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
    ]
  }

  depends_on          = [google_project_service.run_api]
  deletion_protection = false
}

# PDF Exporter Service
resource "google_cloud_run_v2_service" "pdf_exporter" {
  name     = "pdf-exporter"
  location = var.gcp_region
  project  = var.project_id
  ingress  = "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER"

  template {
    service_account = google_service_account.pdf_exporter_sa.email

    containers {
      image = "${var.gcp_region}-docker.pkg.dev/${var.project_id}/app-artifact-repository/pdf-exporter:latest"
      ports {
        container_port = 8080
      }

      env {
        name  = "ALLOWED_ORIGINS"
        value = "https://app.${var.site_url},https://dashboard.${var.site_url}"
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }
    }

    max_instance_request_concurrency = 30
    timeout                          = "30s"

    scaling {
      min_instance_count = 0
      max_instance_count = 5
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

  depends_on          = [google_project_service.run_api]
  deletion_protection = false
}

# Allow the document processor service account to be invoked by Cloud Tasks
resource "google_cloud_run_v2_service_iam_member" "document_processor_invoker" {
  name     = google_cloud_run_v2_service.document_processor.name
  location = google_cloud_run_v2_service.document_processor.location
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.cloud_tasks_sa.email}"
}
