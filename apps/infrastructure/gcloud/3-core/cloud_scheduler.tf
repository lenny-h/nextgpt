# Cloud Scheduler for cleanup jobs
resource "google_cloud_scheduler_job" "cleanup_temporary_files" {
  name             = "${var.project_name}-cleanup-temp-files"
  description      = "Clean up temporary files older than 1 day"
  schedule         = "0 2 * * *" # Run at 2 AM daily
  time_zone        = "America/Los_Angeles"
  attempt_deadline = "320s"
  region           = var.region

  retry_config {
    retry_count = 3
  }

  http_target {
    http_method = "POST"
    uri         = "${google_cloud_run_v2_service.api.uri}/api/cleanup/temporary-files"

    oidc_token {
      service_account_email = data.terraform_remote_state.db_storage.outputs.cloud_run_service_account_email
      audience              = google_cloud_run_v2_service.api.uri
    }
  }
}

# Grant Cloud Scheduler permission to invoke API
resource "google_cloud_run_service_iam_member" "api_scheduler_invoker" {
  location = var.region
  service  = google_cloud_run_v2_service.api.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${data.terraform_remote_state.db_storage.outputs.cloud_run_service_account_email}"
}
