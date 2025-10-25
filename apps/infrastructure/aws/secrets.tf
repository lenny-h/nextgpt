# AWS Secrets Manager secrets for sensitive data

# Database password
resource "aws_secretsmanager_secret" "db_password" {
  name        = "${var.aws_project_name}-db-password"
  description = "PostgreSQL database password"

  tags = {
    Name = "${var.aws_project_name}-db-password"
  }
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = var.db_password
}

# Better Auth secret
resource "aws_secretsmanager_secret" "better_auth_secret" {
  name        = "${var.aws_project_name}-better-auth-secret"
  description = "Better Auth secret key"

  tags = {
    Name = "${var.aws_project_name}-better-auth-secret"
  }
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
}

resource "aws_secretsmanager_secret_version" "resend_api_key" {
  secret_id     = aws_secretsmanager_secret.resend_api_key.id
  secret_string = var.resend_api_key
}

# Google OAuth client secret
resource "aws_secretsmanager_secret_version" "google_client_secret" {
  secret_id     = aws_secretsmanager_secret.google_client_secret.id
  secret_string = var.google_client_secret
}

resource "aws_secretsmanager_secret" "google_client_secret" {
  name        = "${var.aws_project_name}-google-client-secret"
  description = "Google OAuth client secret"
  tags = {
    Name = "${var.aws_project_name}-google-client-secret"
  }
}

# Cloudflare R2 access key ID
resource "aws_secretsmanager_secret" "cloudflare_r2_access_key_id" {
  name        = "${var.aws_project_name}-r2-access-key-id"
  description = "Cloudflare R2 access key ID"

  tags = {
    Name = "${var.aws_project_name}-r2-access-key-id"
  }
}

resource "aws_secretsmanager_secret_version" "cloudflare_r2_access_key_id" {
  secret_id     = aws_secretsmanager_secret.cloudflare_r2_access_key_id.id
  secret_string = var.cloudflare_r2_access_key_id
}

# Cloudflare R2 secret access key
resource "aws_secretsmanager_secret" "cloudflare_r2_secret_access_key" {
  name        = "${var.aws_project_name}-r2-secret-access-key"
  description = "Cloudflare R2 secret access key"

  tags = {
    Name = "${var.aws_project_name}-r2-secret-access-key"
  }
}

resource "aws_secretsmanager_secret_version" "cloudflare_r2_secret_access_key" {
  secret_id     = aws_secretsmanager_secret.cloudflare_r2_secret_access_key.id
  secret_string = var.cloudflare_r2_secret_access_key
}

# Encryption key for sensitive data
resource "aws_secretsmanager_secret" "encryption_key" {
  name        = "${var.aws_project_name}-encryption-key"
  description = "Encryption key for sensitive data"

  tags = {
    Name = "${var.aws_project_name}-encryption-key"
  }
}

resource "aws_secretsmanager_secret_version" "encryption_key" {
  secret_id     = aws_secretsmanager_secret.encryption_key.id
  secret_string = var.encryption_key
}
