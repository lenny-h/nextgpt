# DB Migrator Cloud Run Job
resource "google_cloud_run_v2_job" "db_migrator" {
  name     = "${var.project_name}-db-migrator"
  location = var.region

  template {
    template {
      service_account = google_service_account.cloud_run.email

      vpc_access {
        connector = google_vpc_access_connector.connector.id
        egress    = "PRIVATE_RANGES_ONLY"
      }

      containers {
        image = data.terraform_remote_state.repository.outputs.db_migrator_image_url

        env {
          name  = "DATABASE_URL"
          value = "postgresql://${google_sql_user.user.name}:${random_password.db_password.result}@${google_sql_database_instance.postgres.private_ip_address}:5432/${google_sql_database.database.name}"
        }

        env {
          name  = "NODE_ENV"
          value = var.environment
        }

        resources {
          limits = {
            cpu    = "1"
            memory = "512Mi"
          }
        }
      }

      timeout     = "600s"
      max_retries = 3
      task_count  = 1
      parallelism = 1
    }
  }

  labels = {
    project     = var.project_name
    environment = var.environment
  }

  lifecycle {
    ignore_changes = [
      template[0].template[0].containers[0].image
    ]
  }
}
