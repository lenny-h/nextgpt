# Enable Cloud Run API
resource "google_project_service" "run" {
  project = var.project_id
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
  location = var.region
  project  = var.project_id

  depends_on = [
    google_project_service.run,
    google_sql_database_instance.postgres,
  ]

  template {
    template {
      containers {
        image = "${var.region}-docker.pkg.dev/${var.project_id}/app-artifact-repository/db-migrator:latest"

        env {
          name  = "NODE_ENV"
          value = "production"
        }
        env {
          name  = "DATABASE_URL"
          value = "postgresql://${google_sql_user.postgres_user.name}:${var.db_password}@${google_sql_database_instance.postgres.private_ip_address}:5432/postgres"
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

      service_account = google_service_account.db_migrator_sa.email

      timeout = "600s"
    }
  }

  lifecycle {
    ignore_changes = [
      template[0].template[0].containers[0].image,
    ]
  }
}

# IAM binding to allow CI/CD service account to execute the job
resource "google_cloud_run_v2_job_iam_member" "db_migrator_invoker" {
  name     = google_cloud_run_v2_job.db_migrator.name
  location = google_cloud_run_v2_job.db_migrator.location
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.ci_cd_sa.email}"
}

# Allow CI/CD SA to act as db_migrator service account
resource "google_service_account_iam_member" "ci_cd_act_as_db_migrator_sa" {
  service_account_id = google_service_account.db_migrator_sa.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.ci_cd_sa.email}"
}
