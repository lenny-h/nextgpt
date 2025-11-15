# API Service
resource "google_cloud_run_v2_service" "api" {
  name     = "${var.project_name}-api"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER"

  template {
    service_account = data.terraform_remote_state.db_storage.outputs.cloud_run_service_account_email

    containers {
      image = data.terraform_remote_state.repository.outputs.api_image_url
      ports {
        container_port = 8080
      }

      # Non-sensitive environment variables
      env {
        name  = "NODE_ENV"
        value = var.environment
      }
      env {
        name  = "NEXTAUTH_URL"
        value = var.nextauth_url
      }
      env {
        name  = "DATABASE_URL"
        value = data.terraform_remote_state.db_storage.outputs.database_url
      }
      env {
        name  = "REDIS_URL"
        value = data.terraform_remote_state.db_storage.outputs.redis_url
      }
      env {
        name  = "DOCUMENT_PROCESSOR_URL"
        value = google_cloud_run_v2_service.document_processor.uri
      }
      env {
        name  = "PDF_EXPORTER_URL"
        value = google_cloud_run_v2_service.pdf_exporter.uri
      }
      env {
        name  = "CLOUD_TASKS_QUEUE"
        value = google_cloud_tasks_queue.document_processing.id
      }
      env {
        name  = "TEMPORARY_STORAGE_BUCKET"
        value = google_storage_bucket.temporary_files.name
      }
      env {
        name  = "USE_FIRECRAWL"
        value = "false"
      }
      env {
        name  = "GOOGLE_CLIENT_ID"
        value = var.google_client_id
      }
      env {
        name  = "GITHUB_CLIENT_ID"
        value = var.github_client_id
      }

      # Sensitive secrets from Secret Manager
      env {
        name = "NEXTAUTH_SECRET"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.nextauth_secret.secret_id
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
        name = "GITHUB_CLIENT_SECRET"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.github_client_secret.secret_id
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

      resources {
        limits = {
          cpu    = var.api_cpu
          memory = var.api_memory
        }
      }
    }

    vpc_access {
      network_interfaces {
        network    = data.terraform_remote_state.db_storage.outputs.vpc_network_id
        subnetwork = data.terraform_remote_state.db_storage.outputs.vpc_subnetwork_id
      }
    }

    scaling {
      min_instance_count = var.api_min_instances
      max_instance_count = var.api_max_instances
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

  deletion_protection = false
}

# Allow unauthenticated access to API
resource "google_cloud_run_service_iam_member" "api_noauth" {
  location = google_cloud_run_v2_service.api.location
  service  = google_cloud_run_v2_service.api.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Document Processor Service
resource "google_cloud_run_v2_service" "document_processor" {
  name     = "${var.project_name}-document-processor"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_INTERNAL_ONLY"

  template {
    service_account = data.terraform_remote_state.db_storage.outputs.cloud_run_service_account_email

    containers {
      image = data.terraform_remote_state.repository.outputs.document_processor_image_url
      ports {
        container_port = 8080
      }

      env {
        name  = "DATABASE_URL"
        value = data.terraform_remote_state.db_storage.outputs.database_url
      }
      env {
        name  = "REDIS_URL"
        value = data.terraform_remote_state.db_storage.outputs.redis_url
      }
      env {
        name  = "TEMPORARY_STORAGE_BUCKET"
        value = google_storage_bucket.temporary_files.name
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

      resources {
        limits = {
          cpu    = var.document_processor_cpu
          memory = var.document_processor_memory
        }
      }
    }

    vpc_access {
      network_interfaces {
        network    = data.terraform_remote_state.db_storage.outputs.vpc_network_id
        subnetwork = data.terraform_remote_state.db_storage.outputs.vpc_subnetwork_id
      }
    }

    scaling {
      min_instance_count = var.document_processor_min_instances
      max_instance_count = var.document_processor_max_instances
    }

    max_instance_request_concurrency = 30
    timeout                          = "30s"
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
    ]
  }

  deletion_protection = false
}

# Allow Cloud Tasks to invoke Document Processor
resource "google_cloud_run_v2_service_iam_member" "document_processor_invoker" {
  location = google_cloud_run_v2_service.document_processor.location
  service  = google_cloud_run_v2_service.document_processor.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:service-${data.google_project.project.number}@gcp-sa-cloudtasks.iam.gserviceaccount.com"
}

# PDF Exporter Service
resource "google_cloud_run_v2_service" "pdf_exporter" {
  name     = "${var.project_name}-pdf-exporter"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER"

  template {
    service_account = data.terraform_remote_state.db_storage.outputs.cloud_run_service_account_email

    containers {
      image = data.terraform_remote_state.repository.outputs.pdf_exporter_image_url
      ports {
        container_port = 8080
      }

      env {
        name  = "NODE_ENV"
        value = var.environment
      }

      resources {
        limits = {
          cpu    = var.pdf_exporter_cpu
          memory = var.pdf_exporter_memory
        }
      }
    }

    max_instance_request_concurrency = 30
    timeout                          = "30s"

    scaling {
      min_instance_count = var.pdf_exporter_min_instances
      max_instance_count = var.pdf_exporter_max_instances
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

  deletion_protection = false
}
