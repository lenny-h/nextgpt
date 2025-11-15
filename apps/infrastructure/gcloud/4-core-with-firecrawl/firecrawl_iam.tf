# ===================================
# Firecrawl API Service Account
# ===================================

# Create Service Account for Firecrawl API
resource "google_service_account" "firecrawl_api_sa" {
  account_id   = "firecrawl-api-sa"
  display_name = "Firecrawl API Service Account"
}

# IAM Binding to allow Firecrawl API to access secrets
resource "google_secret_manager_secret_iam_member" "firecrawl_api_db_password_accessor" {
  secret_id = data.terraform_remote_state.db_storage.outputs.db_password_secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.firecrawl_api_sa.email}"
}

# ===================================
# Firecrawl Playwright Service Account
# ===================================

# Create Service Account for Firecrawl Playwright
resource "google_service_account" "firecrawl_playwright_sa" {
  account_id   = "firecrawl-playwright-sa"
  display_name = "Firecrawl Playwright Service Account"
}

# ===================================
# CI/CD IAM for Firecrawl Services
# ===================================

# Allow CI/CD service account to deploy Firecrawl API
resource "google_cloud_run_v2_service_iam_member" "firecrawl_api_deployer" {
  name     = google_cloud_run_v2_service.firecrawl_api.name
  location = google_cloud_run_v2_service.firecrawl_api.location
  role     = "roles/run.admin"
  member   = "serviceAccount:${google_service_account.ci_cd_sa.email}"
}

# Allow CI/CD service account to deploy Firecrawl Playwright
resource "google_cloud_run_v2_service_iam_member" "firecrawl_playwright_deployer" {
  name     = google_cloud_run_v2_service.firecrawl_playwright.name
  location = google_cloud_run_v2_service.firecrawl_playwright.location
  role     = "roles/run.admin"
  member   = "serviceAccount:${google_service_account.ci_cd_sa.email}"
}

# Allow CI/CD SA to act as Firecrawl API service account
resource "google_service_account_iam_member" "ci_cd_act_as_firecrawl_api_sa" {
  service_account_id = google_service_account.firecrawl_api_sa.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.ci_cd_sa.email}"
}

# Allow CI/CD SA to act as Firecrawl Playwright service account
resource "google_service_account_iam_member" "ci_cd_act_as_firecrawl_playwright_sa" {
  service_account_id = google_service_account.firecrawl_playwright_sa.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.ci_cd_sa.email}"
}
