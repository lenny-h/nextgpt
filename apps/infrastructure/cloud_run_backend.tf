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
        container_port = 8000
      }
      env {
        name  = "ALLOWED_ORIGINS"
        value = "https://app.${var.site_url},https://dashboard.${var.site_url}"
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
        name  = "SUPABASE_URL"
        value = "http://supabase-kong.${var.region}.internal"
      }
      env {
        name  = "SUPABASE_ANON_KEY"
        value = var.anon_key
      }
      env {
        name  = "SUPABASE_SERVICE_ROLE_KEY"
        value = var.service_role_key
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
        name  = "TASK_QUEUE_PATH"
        value = "projects/${var.project_id}/locations/${var.region}/queues/pdf-processing-queue"
      }
      env {
        name  = "ENCRYPTION_KEY"
        value = var.encryption_key
      }
      env {
        name  = "PROCESSOR_URL"
        value = "http://pdf-processor.${var.region}.internal"
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

# PDF Processor Service
resource "google_cloud_run_v2_service" "pdf_processor" {
  name     = "pdf-processor"
  location = var.region
  project  = var.project_id
  ingress  = "INGRESS_TRAFFIC_INTERNAL_ONLY"

  template {
    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/app-artifact-repository/pdf-processor:latest"
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
        name  = "SUPABASE_URL"
        value = "http://supabase-kong.${var.region}.internal"
      }
      env {
        name  = "SUPABASE_ANON_KEY"
        value = var.anon_key
      }
      env {
        name  = "SUPABASE_SERVICE_ROLE_KEY"
        value = var.service_role_key
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

    max_instance_request_concurrency = 30
    timeout                          = "30s"

    scaling {
      min_instance_count = 0
      max_instance_count = 5
    }
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
    ]
  }

  depends_on          = [google_project_service.run_api]
  deletion_protection = false
}

# Allow the PDF processor service account to be invoked by Cloud Tasks
resource "google_cloud_run_v2_service_iam_member" "pdf_processor_invoker" {
  name     = google_cloud_run_v2_service.pdf_processor.name
  location = google_cloud_run_v2_service.pdf_processor.location
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.cloud_tasks_sa.email}"
}
