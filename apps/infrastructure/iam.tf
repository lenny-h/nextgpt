# Create a dedicated service account for Cloud Tasks to use
resource "google_service_account" "cloud_tasks_sa" {
  account_id   = "cloud-tasks-sa"
  display_name = "Cloud Tasks Service Account"
}

# IAM for Api Service Account -----------------------------------------------------------------------------

# Create Service Account for App
resource "google_service_account" "api_sa" {
  account_id   = "api-sa"
  display_name = "Api Service Account"
}

# IAM Binding to allow api service account to use vertex AI API
resource "google_project_iam_member" "api_vertex_ai_user" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.api_sa.email}"
}

# IAM Binding to allow api service account to read from pages_bucket
resource "google_storage_bucket_iam_member" "api_pages_bucket_viewer" {
  bucket = google_storage_bucket.pages_bucket.name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${google_service_account.api_sa.email}"
}

# IAM Binding to allow api service account to delete files from pages_bucket
resource "google_storage_bucket_iam_member" "api_pages_bucket_deleter" {
  bucket = google_storage_bucket.pages_bucket.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.api_sa.email}"
}

# IAM Binding to allow api service account to read from correction_bucket
resource "google_storage_bucket_iam_member" "api_correction_bucket_viewer" {
  bucket = google_storage_bucket.correction_bucket.name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${google_service_account.api_sa.email}"
}

# IAM Binding to allow api service account to write to correction_bucket
resource "google_storage_bucket_iam_member" "api_correction_bucket_writer" {
  bucket = google_storage_bucket.correction_bucket.name
  role   = "roles/storage.objectCreator"
  member = "serviceAccount:${google_service_account.api_sa.email}"
}

# IAM Binding to allow api service account to delete files from correction_bucket
resource "google_storage_bucket_iam_member" "api_correction_bucket_deleter" {
  bucket = google_storage_bucket.correction_bucket.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.api_sa.email}"
}

# IAM Binding to allow api service account to manage Cloud Tasks
resource "google_project_iam_member" "api_cloud_tasks_admin" {
  project = var.project_id
  role    = "roles/cloudtasks.admin"
  member  = "serviceAccount:${google_service_account.api_sa.email}"
}

# IAM Binding to allow api to act as the cloud-tasks service account
resource "google_service_account_iam_member" "handler_act_as_cloudtasks_sa" {
  service_account_id = google_service_account.cloud_tasks_sa.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.api_sa.email}"
}

# Create service account key for api
resource "google_service_account_key" "api_sa_key" {
  service_account_id = google_service_account.api_sa.name
}

# IAM for PDF Processor -----------------------------------------------------------------------------------

# Create Service Account for PDF Processor
resource "google_service_account" "pdf_processor_sa" {
  account_id   = "pdf-processor-sa"
  display_name = "pdf Processor Service Account"
}

# IAM Binding to allow pdf_processor to write to pages_bucket
resource "google_storage_bucket_iam_member" "pdf_processor_pages_bucket_writer" {
  bucket = google_storage_bucket.pages_bucket.name
  role   = "roles/storage.objectCreator"
  member = "serviceAccount:${google_service_account.pdf_processor_sa.email}"
}

# IAM Binding to allow pdf_processor to delete files from pages_bucket
resource "google_storage_bucket_iam_member" "pdf_processor_pages_bucket_deleter" {
  bucket = google_storage_bucket.pages_bucket.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.pdf_processor_sa.email}"
}

# IAM Binding to allow pdf_processor to use vertex AI API
resource "google_project_iam_member" "pdf_processor_vertex_ai_user" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.pdf_processor_sa.email}"
}

# IAM for PDF Exporter ------------------------------------------------------------------------------------

# Create Service Account for PDF Exporter
resource "google_service_account" "pdf_exporter_sa" {
  account_id   = "pdf-exporter-sa"
  display_name = "pdf Exporter Service Account"
}

# IAM for CI/CD -------------------------------------------------------------------------------------------

# Create Service Account for CI/CD
resource "google_service_account" "ci_cd_sa" {
  account_id   = "ci-cd-sa"
  display_name = "CI/CD Service Account"
}

# Allow CI/CD service account to deploy api
resource "google_cloud_run_v2_service_iam_member" "api_deployer" {
  name     = google_cloud_run_v2_service.api.name
  location = google_cloud_run_v2_service.api.location
  role     = "roles/run.admin"
  member   = "serviceAccount:${google_service_account.ci_cd_sa.email}"
}

# Allow CI/CD service account to deploy pdf processor
resource "google_cloud_run_v2_service_iam_member" "pdf_processor_deployer" {
  name     = google_cloud_run_v2_service.pdf_processor.name
  location = google_cloud_run_v2_service.pdf_processor.location
  role     = "roles/run.admin"
  member   = "serviceAccount:${google_service_account.ci_cd_sa.email}"
}

# Allow CI/CD service account to deploy pdf exporter
resource "google_cloud_run_v2_service_iam_member" "pdf_exporter_deployer" {
  name     = google_cloud_run_v2_service.pdf_exporter.name
  location = google_cloud_run_v2_service.pdf_exporter.location
  role     = "roles/run.admin"
  member   = "serviceAccount:${google_service_account.ci_cd_sa.email}"
}

# Allow CI/CD service account to deploy analytics
resource "google_cloud_run_v2_service_iam_member" "analytics_deployer" {
  name     = google_cloud_run_v2_service.analytics.name
  location = google_cloud_run_v2_service.analytics.location
  role     = "roles/run.admin"
  member   = "serviceAccount:${google_service_account.ci_cd_sa.email}"
}

# Allow CI/CD service account to deploy auth
resource "google_cloud_run_v2_service_iam_member" "auth_deployer" {
  name     = google_cloud_run_v2_service.auth.name
  location = google_cloud_run_v2_service.auth.location
  role     = "roles/run.admin"
  member   = "serviceAccount:${google_service_account.ci_cd_sa.email}"
}

# Allow CI/CD service account to deploy kong
resource "google_cloud_run_v2_service_iam_member" "kong_deployer" {
  name     = google_cloud_run_v2_service.kong.name
  location = google_cloud_run_v2_service.kong.location
  role     = "roles/run.admin"
  member   = "serviceAccount:${google_service_account.ci_cd_sa.email}"
}

# Allow CI/CD service account to deploy meta
resource "google_cloud_run_v2_service_iam_member" "meta_deployer" {
  name     = google_cloud_run_v2_service.meta.name
  location = google_cloud_run_v2_service.meta.location
  role     = "roles/run.admin"
  member   = "serviceAccount:${google_service_account.ci_cd_sa.email}"
}

# Allow CI/CD service account to deploy rest
resource "google_cloud_run_v2_service_iam_member" "rest_deployer" {
  name     = google_cloud_run_v2_service.rest.name
  location = google_cloud_run_v2_service.rest.location
  role     = "roles/run.admin"
  member   = "serviceAccount:${google_service_account.ci_cd_sa.email}"
}

# Allow CI/CD service account to deploy studio
resource "google_cloud_run_v2_service_iam_member" "studio_deployer" {
  name     = google_cloud_run_v2_service.studio.name
  location = google_cloud_run_v2_service.studio.location
  role     = "roles/run.admin"
  member   = "serviceAccount:${google_service_account.ci_cd_sa.email}"
}

# Allow CI/CD SA to act as Api service account
resource "google_service_account_iam_member" "ci_cd_act_as_api_sa" {
  service_account_id = google_service_account.api_sa.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.ci_cd_sa.email}"
}

# Allow CI/CD SA to act as Pdf processor service account
resource "google_service_account_iam_member" "ci_cd_act_as_pdf_processor_sa" {
  service_account_id = google_service_account.pdf_processor_sa.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.ci_cd_sa.email}"
}

# Allow CI/CD SA to act as Pdf exporter service account
resource "google_service_account_iam_member" "ci_cd_act_as_pdf_exporter_sa" {
  service_account_id = google_service_account.pdf_exporter_sa.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.ci_cd_sa.email}"
}

# Allow CI/CD SA to use Sql Cloud Proxy
resource "google_project_iam_member" "ci_cd_sql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.ci_cd_sa.email}"
}

# Create service account key for ci_cd
resource "google_service_account_key" "ci_cd_sa_key" {
  service_account_id = google_service_account.ci_cd_sa.name
}
