# # ===================================
# # Firecrawl API Service Account
# # ===================================

# # Create Service Account for Firecrawl API
# resource "google_service_account" "firecrawl_api_sa" {
#   account_id   = "firecrawl-api-sa"
#   display_name = "Firecrawl API Service Account"
# }

# # IAM Binding to allow Firecrawl API to access secrets
# resource "google_secret_manager_secret_iam_member" "firecrawl_api_db_password_accessor" {
#   secret_id = data.terraform_remote_state.db_storage.outputs.db_password_secret_id
#   role      = "roles/secretmanager.secretAccessor"
#   member    = "serviceAccount:${google_service_account.firecrawl_api_sa.email}"

#   depends_on = [google_service_account.firecrawl_api_sa]
# }

# # ===================================
# # Firecrawl Playwright Service Account
# # ===================================

# # Create Service Account for Firecrawl Playwright
# resource "google_service_account" "firecrawl_playwright_sa" {
#   account_id   = "firecrawl-playwright-sa"
#   display_name = "Firecrawl Playwright Service Account"
# }

# # ===================================
# # CI/CD IAM for Firecrawl Services
# # ===================================
# # Note: CI/CD permissions are granted at project level in step 2 (2-db-storage)
# # - roles/run.admin (can deploy all Cloud Run services including Firecrawl)
# # - roles/iam.serviceAccountUser (can act as all service accounts)
# # No additional resource-level permissions needed here.
