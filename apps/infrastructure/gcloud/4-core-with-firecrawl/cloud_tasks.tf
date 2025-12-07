# Enable the Cloud Tasks API
resource "google_project_service" "cloud_tasks" {
  project = var.google_vertex_project
  service = "cloudtasks.googleapis.com"
}

# Create a Cloud Tasks queue
resource "google_cloud_tasks_queue" "document_processing_queue" {
  name     = "document-processing-queue"
  location = var.google_vertex_location

  rate_limits {
    max_concurrent_dispatches = 10
    max_dispatches_per_second = 5
  }

  retry_config {
    max_attempts = 1
  }

  depends_on = [google_project_service.cloud_tasks]
}
