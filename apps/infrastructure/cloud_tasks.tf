# Enable the Cloud Tasks API
resource "google_project_service" "cloud_tasks" {
  project = var.project_id
  service = "cloudtasks.googleapis.com"
}

# Create a Cloud Tasks
resource "google_cloud_tasks_queue" "pdf_processing_queue" {
  name     = "pdf-processing-queue"
  location = var.region

  rate_limits {
    max_concurrent_dispatches = 10
    max_dispatches_per_second = 5
  }

  retry_config {
    max_attempts       = 1 // Careful: Retrying is only stopped if both max_attempts and max_retry_duration are reached: https://www.googlecloudcommunity.com/gc/Community-Hub/Cloud-Tasks-retries-task-even-though-max-attempts-1-in-queue/m-p/651691#M3676
    max_retry_duration = "1s"
    min_backoff        = "30s"
    max_backoff        = "600s"
    max_doublings      = 5
  }
}
