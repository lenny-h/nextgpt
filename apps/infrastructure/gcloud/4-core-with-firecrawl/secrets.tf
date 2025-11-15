# Store OAuth secrets
resource "google_secret_manager_secret" "google_client_id" {
  secret_id = "${var.project_name}-google-client-id"

  replication {
    auto {}
  }

  labels = {
    project     = var.project_name
    environment = var.environment
  }
}

resource "google_secret_manager_secret_version" "google_client_id" {
  secret      = google_secret_manager_secret.google_client_id.id
  secret_data = var.google_client_id
}

resource "google_secret_manager_secret" "google_client_secret" {
  secret_id = "${var.project_name}-google-client-secret"

  replication {
    auto {}
  }

  labels = {
    project     = var.project_name
    environment = var.environment
  }
}

resource "google_secret_manager_secret_version" "google_client_secret" {
  secret      = google_secret_manager_secret.google_client_secret.id
  secret_data = var.google_client_secret
}

resource "google_secret_manager_secret" "github_client_id" {
  secret_id = "${var.project_name}-github-client-id"

  replication {
    auto {}
  }

  labels = {
    project     = var.project_name
    environment = var.environment
  }
}

resource "google_secret_manager_secret_version" "github_client_id" {
  secret      = google_secret_manager_secret.github_client_id.id
  secret_data = var.github_client_id
}

resource "google_secret_manager_secret" "github_client_secret" {
  secret_id = "${var.project_name}-github-client-secret"

  replication {
    auto {}
  }

  labels = {
    project     = var.project_name
    environment = var.environment
  }
}

resource "google_secret_manager_secret_version" "github_client_secret" {
  secret      = google_secret_manager_secret.github_client_secret.id
  secret_data = var.github_client_secret
}

# Auth secrets
resource "google_secret_manager_secret" "nextauth_secret" {
  secret_id = "${var.project_name}-nextauth-secret"

  replication {
    auto {}
  }

  labels = {
    project     = var.project_name
    environment = var.environment
  }
}

resource "google_secret_manager_secret_version" "nextauth_secret" {
  secret      = google_secret_manager_secret.nextauth_secret.id
  secret_data = var.nextauth_secret
}

# Encryption key
resource "google_secret_manager_secret" "encryption_key" {
  secret_id = "${var.project_name}-encryption-key"

  replication {
    auto {}
  }

  labels = {
    project     = var.project_name
    environment = var.environment
  }
}

resource "google_secret_manager_secret_version" "encryption_key" {
  secret      = google_secret_manager_secret.encryption_key.id
  secret_data = var.encryption_key
}

# Firecrawl API Key
resource "google_secret_manager_secret" "firecrawl_api_key" {
  secret_id = "${var.project_name}-firecrawl-api-key"

  replication {
    auto {}
  }

  labels = {
    project     = var.project_name
    environment = var.environment
  }
}

resource "google_secret_manager_secret_version" "firecrawl_api_key" {
  secret      = google_secret_manager_secret.firecrawl_api_key.id
  secret_data = var.firecrawl_api_key
}
