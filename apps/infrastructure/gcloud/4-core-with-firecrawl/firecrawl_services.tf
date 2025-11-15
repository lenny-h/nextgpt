# ==============================================================================
# Firecrawl Services
# ==============================================================================

# Firecrawl API Service
resource "google_cloud_run_v2_service" "firecrawl_api" {
  name     = "firecrawl-api"
  location = var.google_vertex_location
  project  = var.google_vertex_project
  ingress  = "INGRESS_TRAFFIC_INTERNAL_ONLY"

  template {
    service_account = google_service_account.firecrawl_api_sa.email

    containers {
      image = "${var.google_vertex_location}-docker.pkg.dev/${var.google_vertex_project}/app-artifact-repository/firecrawl:latest"
      ports {
        container_port = 8080
      }

      # Server configuration
      env {
        name  = "HOST"
        value = "0.0.0.0"
      }
      env {
        name  = "EXTRACT_WORKER_PORT"
        value = "3004"
      }
      env {
        name  = "WORKER_PORT"
        value = "3005"
      }
      env {
        name  = "ENV"
        value = "local"
      }

      # Redis configuration
      env {
        name  = "REDIS_URL"
        value = data.terraform_remote_state.db_storage.outputs.redis_url
      }
      env {
        name  = "REDIS_RATE_LIMIT_URL"
        value = data.terraform_remote_state.db_storage.outputs.redis_url
      }

      # Playwright microservice
      env {
        name  = "PLAYWRIGHT_MICROSERVICE_URL"
        value = google_cloud_run_v2_service.firecrawl_playwright.uri
      }

      # Database configuration
      env {
        name  = "NUQ_DATABASE_URL"
        value = "postgresql://postgres@${data.terraform_remote_state.db_storage.outputs.postgres_private_ip}:5432/postgres"
      }

      # Database password secret
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
          memory = "2Gi"
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

    max_instance_request_concurrency = 80
    timeout                          = "300s"
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

  depends_on          = [google_project_service.run]
  deletion_protection = false
}

# Firecrawl Playwright Service
resource "google_cloud_run_v2_service" "firecrawl_playwright" {
  name     = "firecrawl-playwright"
  location = var.google_vertex_location
  project  = var.google_vertex_project
  ingress  = "INGRESS_TRAFFIC_INTERNAL_ONLY"

  template {
    service_account = google_service_account.firecrawl_playwright_sa.email

    containers {
      image = "${var.google_vertex_location}-docker.pkg.dev/${var.google_vertex_project}/app-artifact-repository/firecrawl-playwright:latest"
      ports {
        container_port = 8080
      }

      resources {
        limits = {
          cpu    = "2"
          memory = "2Gi"
        }
      }
    }

    scaling {
      min_instance_count = 0
      max_instance_count = 5
    }

    max_instance_request_concurrency = 80
    timeout                          = "300s"
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

  depends_on          = [google_project_service.run]
  deletion_protection = false
}

# Allow API service to invoke Firecrawl API service
resource "google_cloud_run_v2_service_iam_member" "firecrawl_api_invoker" {
  name     = google_cloud_run_v2_service.firecrawl_api.name
  location = google_cloud_run_v2_service.firecrawl_api.location
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.api_sa.email}"
}

# Allow Firecrawl API to invoke Playwright service
resource "google_cloud_run_v2_service_iam_member" "firecrawl_playwright_invoker" {
  name     = google_cloud_run_v2_service.firecrawl_playwright.name
  location = google_cloud_run_v2_service.firecrawl_playwright.location
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.firecrawl_api_sa.email}"
}
