# API Service
resource "google_cloud_run_v2_service" "api" {
  name     = "api"
  location = var.region
  project  = var.project_id
  ingress  = "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER"

  template {
    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/app-artifact-repository/api:latest"
      ports {
        container_port = 8080
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
        name  = "ALLOWED_EMAIL_DOMAINS"
        value = var.allowed_email_domains
      }
      env {
        name  = "RESEND_API_KEY"
        value = var.resend_api_key
      }
      env {
        name  = "RESEND_SENDER_EMAIL"
        value = var.resend_sender_email
      }
      env {
        name  = "GOOGLE_VERTEX_PROJECT"
        value = var.project_id
      }
      env {
        name  = "GOOGLE_VERTEX_LOCATION"
        value = var.region
      }
      env {
        name  = "BETTER_AUTH_URL"
        value = "https://api.${var.site_url}"
      }
      env {
        name  = "BETTER_AUTH_SECRET"
        value = var.better_auth_secret
      }
      env {
        name  = "DATABASE_URL"
        value = "postgresql://postgres:${var.db_password}@${google_sql_database_instance.postgres.ip_address[0].ip_address}/postgres"
      }
      env {
        name  = "REDIS_URL"
        value = "redis://${google_redis_instance.redis.host}:${google_redis_instance.redis.port}"
      }
      env {
        name  = "R2_ENDPOINT"
        value = "https://${var.cloudflare_account_id}.r2.cloudflarestorage.com"
      }
      env {
        name  = "CLOUDFLARE_ACCESS_KEY_ID"
        value = var.cloudflare_r2_access_key_id
      }
      env {
        name  = "CLOUDFLARE_SECRET_ACCESS_KEY"
        value = var.cloudflare_r2_secret_access_key
      }
      env {
        name  = "CLOUD_TASKS_SA"
        value = google_service_account.cloud_tasks_sa.email
      }
      env {
        name  = "PROCESSOR_URL"
        value = "http://document-processor.${var.region}.internal"
      }
      env {
        name  = "TASK_QUEUE_PATH"
        value = "projects/${var.project_id}/locations/${var.region}/queues/document-processing-queue"
      }
      env {
        name  = "ENCRYPTION_KEY"
        value = var.encryption_key
      }
      env {
        name  = "ATTACHMENT_URL_PREFIX"
        value = "https://storage.googleapis.com/${var.project_id}-temporary-files-bucket/"
      }
      env {
        name  = "EMBEDDINGS_MODEL"
        value = var.embeddings_model
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
  location = var.region
  project  = var.project_id
  ingress  = "INGRESS_TRAFFIC_INTERNAL_ONLY"

  template {
    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/app-artifact-repository/document-processor:latest"
      ports {
        container_port = 8080
      }
      env {
        name  = "GOOGLE_VERTEX_PROJECT"
        value = var.project_id
      }
      env {
        name  = "GOOGLE_VERTEX_LOCATION"
        value = var.region
      }
      env {
        name  = "DATABASE_URL"
        value = "postgresql://postgres:${var.db_password}@${google_sql_database_instance.postgres.ip_address[0].ip_address}/postgres"
      }
      env {
        name  = "R2_ENDPOINT"
        value = "https://${var.cloudflare_account_id}.r2.cloudflarestorage.com"
      }
      env {
        name  = "CLOUDFLARE_ACCESS_KEY_ID"
        value = var.cloudflare_r2_access_key_id
      }
      env {
        name  = "CLOUDFLARE_SECRET_ACCESS_KEY"
        value = var.cloudflare_r2_secret_access_key
      }
      env {
        name  = "EMBEDDINGS_MODEL"
        value = var.embeddings_model
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
  location = var.region
  project  = var.project_id
  ingress  = "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER"

  template {
    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/app-artifact-repository/pdf-exporter:latest"
      ports {
        container_port = 8080
      }
      env {
        name  = "ALLOWED_ORIGINS"
        value = "https://app.${var.site_url},https://dashboard.${var.site_url}"
      }
      env {
        name  = "GOOGLE_VERTEX_PROJECT"
        value = var.project_id
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
