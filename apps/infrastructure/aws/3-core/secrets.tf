# Better Auth secret
resource "aws_secretsmanager_secret" "better_auth_secret" {
  name        = "${var.aws_project_name}-better-auth-secret"
  description = "Better Auth secret key"

  tags = {
    Name = "${var.aws_project_name}-better-auth-secret"
  }

  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "better_auth_secret" {
  secret_id     = aws_secretsmanager_secret.better_auth_secret.id
  secret_string = var.better_auth_secret
}

# Resend API key
resource "aws_secretsmanager_secret" "resend_api_key" {
  name        = "${var.aws_project_name}-resend-api-key"
  description = "Resend API key for email sending"

  tags = {
    Name = "${var.aws_project_name}-resend-api-key"
  }

  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "resend_api_key" {
  secret_id     = aws_secretsmanager_secret.resend_api_key.id
  secret_string = var.resend_api_key
}

# Cloudflare R2 access key ID
resource "aws_secretsmanager_secret" "cloudflare_r2_access_key_id" {
  count       = var.use_cloudflare_r2 ? 1 : 0
  name        = "${var.aws_project_name}-r2-access-key-id"
  description = "Cloudflare R2 access key ID"

  tags = {
    Name = "${var.aws_project_name}-r2-access-key-id"
  }

  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "cloudflare_r2_access_key_id" {
  count         = var.use_cloudflare_r2 ? 1 : 0
  secret_id     = aws_secretsmanager_secret.cloudflare_r2_access_key_id[0].id
  secret_string = var.cloudflare_access_key_id
}

# Cloudflare R2 secret access key
resource "aws_secretsmanager_secret" "cloudflare_r2_secret_access_key" {
  count       = var.use_cloudflare_r2 ? 1 : 0
  name        = "${var.aws_project_name}-r2-secret-access-key"
  description = "Cloudflare R2 secret access key"

  tags = {
    Name = "${var.aws_project_name}-r2-secret-access-key"
  }

  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "cloudflare_r2_secret_access_key" {
  count         = var.use_cloudflare_r2 ? 1 : 0
  secret_id     = aws_secretsmanager_secret.cloudflare_r2_secret_access_key[0].id
  secret_string = var.cloudflare_secret_access_key
}

# Encryption key for sensitive data
resource "aws_secretsmanager_secret" "encryption_key" {
  name        = "${var.aws_project_name}-encryption-key"
  description = "Encryption key for sensitive data"

  tags = {
    Name = "${var.aws_project_name}-encryption-key"
  }

  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "encryption_key" {
  secret_id     = aws_secretsmanager_secret.encryption_key.id
  secret_string = var.encryption_key
}

# Google OAuth client secret
resource "aws_secretsmanager_secret" "google_client_secret" {
  count       = var.enable_oauth_login ? 1 : 0
  name        = "${var.aws_project_name}-google-client-secret"
  description = "Google OAuth client secret"
  tags = {
    Name = "${var.aws_project_name}-google-client-secret"
  }

  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "google_client_secret" {
  count         = var.enable_oauth_login ? 1 : 0
  secret_id     = aws_secretsmanager_secret.google_client_secret[0].id
  secret_string = var.google_client_secret
}

# GitHub OAuth client secret
resource "aws_secretsmanager_secret" "github_client_secret" {
  count       = var.enable_oauth_login ? 1 : 0
  name        = "${var.aws_project_name}-github-client-secret"
  description = "GitHub OAuth client secret"

  tags = {
    Name = "${var.aws_project_name}-github-client-secret"
  }

  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "github_client_secret" {
  count         = var.enable_oauth_login ? 1 : 0
  secret_id     = aws_secretsmanager_secret.github_client_secret[0].id
  secret_string = var.github_client_secret
}

# GitLab OAuth client secret
resource "aws_secretsmanager_secret" "gitlab_client_secret" {
  count       = var.enable_oauth_login ? 1 : 0
  name        = "${var.aws_project_name}-gitlab-client-secret"
  description = "GitLab OAuth client secret"

  tags = {
    Name = "${var.aws_project_name}-gitlab-client-secret"
  }

  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "gitlab_client_secret" {
  count         = var.enable_oauth_login ? 1 : 0
  secret_id     = aws_secretsmanager_secret.gitlab_client_secret[0].id
  secret_string = var.gitlab_client_secret
}

# SSO client secret
resource "aws_secretsmanager_secret" "sso_client_secret" {
  count       = var.enable_sso ? 1 : 0
  name        = "${var.aws_project_name}-sso-client-secret"
  description = "SSO client secret"

  tags = {
    Name = "${var.aws_project_name}-sso-client-secret"
  }

  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "sso_client_secret" {
  count         = var.enable_sso ? 1 : 0
  secret_id     = aws_secretsmanager_secret.sso_client_secret[0].id
  secret_string = var.sso_client_secret
}

# Firecrawl API key
resource "aws_secretsmanager_secret" "firecrawl_api_key" {
  count       = var.use_firecrawl ? 1 : 0
  name        = "${var.aws_project_name}-firecrawl-api-key"
  description = "Firecrawl API key"

  tags = {
    Name = "${var.aws_project_name}-firecrawl-api-key"
  }

  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "firecrawl_api_key" {
  count         = var.use_firecrawl ? 1 : 0
  secret_id     = aws_secretsmanager_secret.firecrawl_api_key[0].id
  secret_string = var.firecrawl_api_key
}
