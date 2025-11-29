# Enable the Cloud Tasks API
resource "google_project_service" "cloud_tasks" {
  project = var.google_vertex_project
  service = "cloudtasks.googleapis.com"
}

# Create a Cloud Tasks queue
resource "google_cloud_tasks_queue" "document_processing_queue" {
  name     = "document-processing-queue"
  project  = var.google_vertex_project
  location = var.google_vertex_location

  rate_limits {
    max_concurrent_dispatches = 10
    max_dispatches_per_second = 5
  }

  retry_config {
    max_attempts       = 1
    max_retry_duration = "1s"
    min_backoff        = "30s"
    max_backoff        = "600s"
    max_doublings      = 5
  }

  depends_on = [google_project_service.cloud_tasks]
}
