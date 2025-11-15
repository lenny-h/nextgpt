# Enable Cloud Run API
resource "google_project_service" "run" {
  project = var.google_vertex_project
  service = "run.googleapis.com"
}

# Service Account for DB Migrator
resource "google_service_account" "db_migrator_sa" {
  account_id   = "db-migrator-sa"
  display_name = "DB Migrator Service Account"
}

# Cloud Run Job for database migrations
resource "google_cloud_run_v2_job" "db_migrator" {
  name     = "db-migrator"
  location = var.google_vertex_location
  project  = var.google_vertex_project

  depends_on = [
    google_project_service.run,
    google_sql_database_instance.postgres,
  ]

  template {
    template {
      service_account = google_service_account.db_migrator_sa.email

      containers {
        image = "${var.google_vertex_location}-docker.pkg.dev/${var.google_vertex_project}/app-artifact-repository/db-migrator:latest"

        # Non-sensitive environment variables
        env {
          name  = "NODE_ENV"
          value = "production"
        }
        env {
          name  = "DATABASE_HOST"
          value = google_sql_database_instance.postgres.private_ip_address
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
        egress = "PRIVATE_RANGES_ONLY"
      }

      timeout = "600s"
    }
  }

  lifecycle {
    ignore_changes = [
      template[0].template[0].containers[0].image,
    ]
  }
}

# IAM binding to allow db_migrator service account to access secrets
resource "google_secret_manager_secret_iam_member" "db_migrator_db_password_accessor" {
  secret_id = google_secret_manager_secret.db_password.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.db_migrator_sa.email}"
}
