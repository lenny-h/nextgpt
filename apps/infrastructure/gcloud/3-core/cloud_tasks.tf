# Cloud Tasks Queue for document processing
resource "google_cloud_tasks_queue" "document_processing" {
  name     = "${var.project_name}-document-processing"
  location = var.region

  rate_limits {
    max_dispatches_per_second = 10
    max_concurrent_dispatches = 5
  }

  retry_config {
    max_attempts       = 3
    max_retry_duration = "300s"
    max_backoff        = "60s"
    min_backoff        = "5s"
    max_doublings      = 3
  }
}

# Grant Cloud Tasks permissions to invoke Cloud Run
resource "google_cloud_run_service_iam_member" "document_processor_invoker" {
  location = var.region
  service  = google_cloud_run_v2_service.document_processor.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:service-${data.google_project.project.number}@gcp-sa-cloudtasks.iam.gserviceaccount.com"
}

data "google_project" "project" {
  project_id = var.project_id
}
