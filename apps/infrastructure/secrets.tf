# # Enable the Google Secret Manager API
# resource "google_project_service" "secretmanager_api" {
#   service = "secretmanager.googleapis.com"
# }

# resource "google_secret_manager_secret" "db_password" {
#   secret_id = "db-password"

#   replication {
#     auto {}
#   }

#   depends_on = [google_project_service.secretmanager_api]
# }

# resource "google_secret_manager_secret_version" "db_password" {
#   secret      = google_secret_manager_secret.db_password.id
#   secret_data = var.db_password

#   depends_on = [google_project_service.secretmanager_api]
# }

# resource "google_secret_manager_secret" "jwt_secret" {
#   secret_id = "supabase-jwt-secret"

#   replication {
#     auto {}
#   }

#   depends_on = [google_project_service.secretmanager_api]
# }

# resource "google_secret_manager_secret_version" "jwt_secret" {
#   secret      = google_secret_manager_secret.jwt_secret.id
#   secret_data = var.jwt_secret

#   depends_on = [google_project_service.secretmanager_api]
# }

# resource "google_secret_manager_secret" "service_role_key" {
#   secret_id = "supabase-service-role-key"

#   replication {
#     auto {}
#   }

#   depends_on = [google_project_service.secretmanager_api]
# }

# resource "google_secret_manager_secret_version" "service_role_key" {
#   secret      = google_secret_manager_secret.service_role_key.id
#   secret_data = var.service_role_key

#   depends_on = [google_project_service.secretmanager_api]
# }

# resource "google_secret_manager_secret" "logflare_private_access_token" {
#   secret_id = "supabase-logflare-private-token"

#   replication {
#     auto {}
#   }

#   depends_on = [google_project_service.secretmanager_api]
# }

# resource "google_secret_manager_secret_version" "logflare_private_access_token" {
#   secret      = google_secret_manager_secret.logflare_private_access_token.id
#   secret_data = var.logflare_private_access_token

#   depends_on = [google_project_service.secretmanager_api]
# }

# # Cloudflare R2 Secrets
# resource "google_secret_manager_secret" "cloudflare_r2_access_key_id" {
#   secret_id = "r2-access-key-id"

#   replication {
#     auto {}
#   }

#   depends_on = [google_project_service.secretmanager_api]
# }

# resource "google_secret_manager_secret_version" "cloudflare_r2_access_key_id" {
#   secret      = google_secret_manager_secret.cloudflare_r2_access_key_id.id
#   secret_data = var.cloudflare_r2_access_key_id

#   depends_on = [google_project_service.secretmanager_api]
# }

# resource "google_secret_manager_secret" "cloudflare_r2_secret_access_key" {
#   secret_id = "r2-secret-access-key"

#   replication {
#     auto {}
#   }

#   depends_on = [google_project_service.secretmanager_api]
# }

# resource "google_secret_manager_secret_version" "cloudflare_r2_secret_access_key" {
#   secret      = google_secret_manager_secret.cloudflare_r2_secret_access_key.id
#   secret_data = var.cloudflare_r2_secret_access_key

#   depends_on = [google_project_service.secretmanager_api]
# }

# # Encryption key for sensitive data
# resource "google_secret_manager_secret" "encryption_key" {
#   secret_id = "encryption-key"
#   replication {
#     auto {}
#   }

#   depends_on = [google_project_service.secretmanager_api]
# }

# resource "google_secret_manager_secret_version" "encryption_key" {
#   secret      = google_secret_manager_secret.encryption_key.id
#   secret_data = var.encryption_key

#   depends_on = [google_project_service.secretmanager_api]
# }

