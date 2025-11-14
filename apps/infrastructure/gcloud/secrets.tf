# Enable the Google Secret Manager API
resource "google_project_service" "secretmanager_api" {
  service = "secretmanager.googleapis.com"
  project = var.google_vertex_project
}

# Database password
resource "google_secret_manager_secret" "db_password" {
  project   = var.google_vertex_project
  secret_id = "db-password"

  replication {
    auto {}
  }

  depends_on = [google_project_service.secretmanager_api]
}

resource "google_secret_manager_secret_version" "db_password" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = var.database_password

  depends_on = [google_project_service.secretmanager_api]
}

# Better Auth secret
resource "google_secret_manager_secret" "better_auth_secret" {
  project   = var.google_vertex_project
  secret_id = "better-auth-secret"

  replication {
    auto {}
  }

  depends_on = [google_project_service.secretmanager_api]
}

resource "google_secret_manager_secret_version" "better_auth_secret" {
  secret      = google_secret_manager_secret.better_auth_secret.id
  secret_data = var.better_auth_secret

  depends_on = [google_project_service.secretmanager_api]
}

# Resend API key
resource "google_secret_manager_secret" "resend_api_key" {
  project   = var.google_vertex_project
  secret_id = "resend-api-key"

  replication {
    auto {}
  }

  depends_on = [google_project_service.secretmanager_api]
}

resource "google_secret_manager_secret_version" "resend_api_key" {
  secret      = google_secret_manager_secret.resend_api_key.id
  secret_data = var.resend_api_key

  depends_on = [google_project_service.secretmanager_api]
}

# Cloudflare R2 access key ID
resource "google_secret_manager_secret" "cloudflare_r2_access_key_id" {
  project   = var.google_vertex_project
  secret_id = "r2-access-key-id"

  replication {
    auto {}
  }

  depends_on = [google_project_service.secretmanager_api]
}

resource "google_secret_manager_secret_version" "cloudflare_r2_access_key_id" {
  secret      = google_secret_manager_secret.cloudflare_r2_access_key_id.id
  secret_data = var.cloudflare_access_key_id

  depends_on = [google_project_service.secretmanager_api]
}

# Cloudflare R2 secret access key
resource "google_secret_manager_secret" "cloudflare_r2_secret_access_key" {
  project   = var.google_vertex_project
  secret_id = "r2-secret-access-key"

  replication {
    auto {}
  }

  depends_on = [google_project_service.secretmanager_api]
}

resource "google_secret_manager_secret_version" "cloudflare_r2_secret_access_key" {
  secret      = google_secret_manager_secret.cloudflare_r2_secret_access_key.id
  secret_data = var.cloudflare_secret_access_key

  depends_on = [google_project_service.secretmanager_api]
}

# Encryption key for sensitive data
resource "google_secret_manager_secret" "encryption_key" {
  project   = var.google_vertex_project
  secret_id = "encryption-key"

  replication {
    auto {}
  }

  depends_on = [google_project_service.secretmanager_api]
}

resource "google_secret_manager_secret_version" "encryption_key" {
  secret      = google_secret_manager_secret.encryption_key.id
  secret_data = var.encryption_key

  depends_on = [google_project_service.secretmanager_api]
}

# Google Client Secret
resource "google_secret_manager_secret" "google_client_secret" {
  project   = var.google_vertex_project
  secret_id = "google-client-secret"
  replication {
    auto {}
  }

  depends_on = [google_project_service.secretmanager_api]
}

resource "google_secret_manager_secret_version" "google_client_secret" {
  secret      = google_secret_manager_secret.google_client_secret.id
  secret_data = var.google_client_secret

  depends_on = [google_project_service.secretmanager_api]
}

# GitHub OAuth client secret
resource "google_secret_manager_secret" "github_client_secret" {
  project   = var.google_vertex_project
  secret_id = "github-client-secret"

  replication {
    auto {}
  }

  depends_on = [google_project_service.secretmanager_api]
}

resource "google_secret_manager_secret_version" "github_client_secret" {
  secret      = google_secret_manager_secret.github_client_secret.id
  secret_data = var.github_client_secret

  depends_on = [google_project_service.secretmanager_api]
}

# GitLab OAuth client secret
resource "google_secret_manager_secret" "gitlab_client_secret" {
  project   = var.google_vertex_project
  secret_id = "gitlab-client-secret"

  replication {
    auto {}
  }

  depends_on = [google_project_service.secretmanager_api]
}

resource "google_secret_manager_secret_version" "gitlab_client_secret" {
  secret      = google_secret_manager_secret.gitlab_client_secret.id
  secret_data = var.gitlab_client_secret

  depends_on = [google_project_service.secretmanager_api]
}

# SSO client secret
resource "google_secret_manager_secret" "sso_client_secret" {
  project   = var.google_vertex_project
  secret_id = "sso-client-secret"

  replication {
    auto {}
  }

  depends_on = [google_project_service.secretmanager_api]
}

resource "google_secret_manager_secret_version" "sso_client_secret" {
  secret      = google_secret_manager_secret.sso_client_secret.id
  secret_data = var.sso_client_secret

  depends_on = [google_project_service.secretmanager_api]
}

# Firecrawl API key
resource "google_secret_manager_secret" "firecrawl_api_key" {
  project   = var.google_vertex_project
  secret_id = "firecrawl-api-key"

  replication {
    auto {}
  }

  depends_on = [google_project_service.secretmanager_api]
}

resource "google_secret_manager_secret_version" "firecrawl_api_key" {
  secret      = google_secret_manager_secret.firecrawl_api_key.id
  secret_data = var.firecrawl_api_key

  depends_on = [google_project_service.secretmanager_api]
}

