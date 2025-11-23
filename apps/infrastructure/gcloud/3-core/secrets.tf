# Better Auth secret
resource "google_secret_manager_secret" "better_auth_secret" {
  project   = var.google_vertex_project
  secret_id = "better-auth-secret"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "better_auth_secret" {
  secret      = google_secret_manager_secret.better_auth_secret.id
  secret_data = var.better_auth_secret
}

# Resend API key
resource "google_secret_manager_secret" "resend_api_key" {
  project   = var.google_vertex_project
  secret_id = "resend-api-key"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "resend_api_key" {
  secret      = google_secret_manager_secret.resend_api_key.id
  secret_data = var.resend_api_key
}

# Cloudflare R2 access key ID
resource "google_secret_manager_secret" "cloudflare_r2_access_key_id" {
  count     = var.use_cloudflare_r2 ? 1 : 0
  project   = var.google_vertex_project
  secret_id = "r2-access-key-id"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "cloudflare_r2_access_key_id" {
  count       = var.use_cloudflare_r2 ? 1 : 0
  secret      = google_secret_manager_secret.cloudflare_r2_access_key_id[0].id
  secret_data = var.cloudflare_access_key_id
}

# Cloudflare R2 secret access key
resource "google_secret_manager_secret" "cloudflare_r2_secret_access_key" {
  count     = var.use_cloudflare_r2 ? 1 : 0
  project   = var.google_vertex_project
  secret_id = "r2-secret-access-key"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "cloudflare_r2_secret_access_key" {
  count       = var.use_cloudflare_r2 ? 1 : 0
  secret      = google_secret_manager_secret.cloudflare_r2_secret_access_key[0].id
  secret_data = var.cloudflare_secret_access_key
}

# Encryption key for sensitive data
resource "google_secret_manager_secret" "encryption_key" {
  project   = var.google_vertex_project
  secret_id = "encryption-key"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "encryption_key" {
  secret      = google_secret_manager_secret.encryption_key.id
  secret_data = var.encryption_key
}

# Google OAuth client secret
resource "google_secret_manager_secret" "google_client_secret" {
  count     = var.enable_oauth_login ? 1 : 0
  project   = var.google_vertex_project
  secret_id = "google-client-secret"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "google_client_secret" {
  count       = var.enable_oauth_login ? 1 : 0
  secret      = google_secret_manager_secret.google_client_secret[0].id
  secret_data = var.google_client_secret
}

# GitHub OAuth client secret
resource "google_secret_manager_secret" "github_client_secret" {
  count     = var.enable_oauth_login ? 1 : 0
  project   = var.google_vertex_project
  secret_id = "github-client-secret"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "github_client_secret" {
  count       = var.enable_oauth_login ? 1 : 0
  secret      = google_secret_manager_secret.github_client_secret[0].id
  secret_data = var.github_client_secret
}

# GitLab OAuth client secret
resource "google_secret_manager_secret" "gitlab_client_secret" {
  count     = var.enable_oauth_login ? 1 : 0
  project   = var.google_vertex_project
  secret_id = "gitlab-client-secret"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "gitlab_client_secret" {
  count       = var.enable_oauth_login ? 1 : 0
  secret      = google_secret_manager_secret.gitlab_client_secret[0].id
  secret_data = var.gitlab_client_secret
}

# SSO client secret
resource "google_secret_manager_secret" "sso_client_secret" {
  count     = var.enable_sso ? 1 : 0
  project   = var.google_vertex_project
  secret_id = "sso-client-secret"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "sso_client_secret" {
  count       = var.enable_sso ? 1 : 0
  secret      = google_secret_manager_secret.sso_client_secret[0].id
  secret_data = var.sso_client_secret
}

resource "google_secret_manager_secret" "firecrawl_api_key" {
  count     = var.use_firecrawl ? 1 : 0
  project   = var.google_vertex_project
  secret_id = "firecrawl-api-key"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "firecrawl_api_key" {
  count       = var.use_firecrawl ? 1 : 0
  secret      = google_secret_manager_secret.firecrawl_api_key[0].id
  secret_data = var.firecrawl_api_key
}
