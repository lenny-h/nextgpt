# Document Processor Cloud Run Job
# Runs as a job triggered by Cloud Tasks via Cloud Run Admin API
# Unlike a service, this executes to completion and terminates

resource "google_cloud_run_v2_job" "document_processor" {
  name                = "document-processor"
  project             = var.google_vertex_project
  location            = var.google_vertex_location
  deletion_protection = false

  template {
    template {
      service_account = google_service_account.document_processor_sa.email

      containers {
        image = "${var.google_vertex_location}-docker.pkg.dev/${var.google_vertex_project}/app-artifact-repository/document-processor:latest"

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
        env {
          name  = "EMBEDDINGS_MODEL"
          value = var.embeddings_model
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
            memory = "6Gi"
          }
        }
      }

      vpc_access {
        network_interfaces {
          network    = data.terraform_remote_state.db_storage.outputs.vpc_network_id
          subnetwork = data.terraform_remote_state.db_storage.outputs.subnet_id
        }
      }

      # Document processing can take a while - set 40 minutes timeout
      timeout = "2400s"
    }
  }

  lifecycle {
    ignore_changes = [
      template[0].template[0].containers[0].image,
    ]
  }

  depends_on = [
    google_project_service.run,
    google_service_account.document_processor_sa,
    google_secret_manager_secret_version.encryption_key
  ]
}

# IAM binding to allow Cloud Tasks SA to invoke the Cloud Run Job via Admin API
resource "google_cloud_run_v2_job_iam_member" "document_processor_invoker" {
  project  = var.google_vertex_project
  location = var.google_vertex_location
  name     = google_cloud_run_v2_job.document_processor.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.cloud_tasks_sa.email}"
}
