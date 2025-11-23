variable "site_url" {
  type        = string
  description = "Site URL (e.g. example.com)"
}

# Authentication configuration
variable "better_auth_secret" {
  type        = string
  description = "Secret used for Better Auth"
  sensitive   = true
}

variable "only_allow_admin_to_create_buckets" {
  type        = bool
  description = "Only allow admin users to create buckets"
}

variable "admin_user_ids" {
  type        = string
  description = "Comma-separated list of admin user IDs"
}

variable "enable_email_signup" {
  type        = bool
  description = "Enable email/password sign-up"
}

variable "allowed_email_domains" {
  type        = string
  description = "Comma-separated list of allowed email domains for sign-up"
}

variable "enable_oauth_login" {
  type        = bool
  description = "Enable OAuth login"
}

variable "google_client_id" {
  type        = string
  description = "Google OAuth client ID"
}

variable "google_client_secret" {
  type        = string
  description = "Google OAuth client secret"
  sensitive   = true
}

variable "github_client_id" {
  type        = string
  description = "GitHub OAuth client ID"
}

variable "github_client_secret" {
  type        = string
  description = "GitHub OAuth client secret"
  sensitive   = true
}

variable "gitlab_client_id" {
  type        = string
  description = "GitLab OAuth client ID"
}

variable "gitlab_client_secret" {
  type        = string
  description = "GitLab OAuth client secret"
  sensitive   = true
}

# SSO Configuration
variable "enable_sso" {
  type        = bool
  description = "Enable SSO"
}

variable "sso_domain" {
  type        = string
  description = "SSO domain"
}

variable "sso_provider_id" {
  type        = string
  description = "SSO provider id"
}

variable "sso_client_id" {
  type        = string
  description = "SSO client id"
}

variable "sso_client_secret" {
  type        = string
  description = "SSO client secret"
  sensitive   = true
}

variable "sso_issuer" {
  type        = string
  description = "SSO issuer"
}

variable "sso_authorization_endpoint" {
  type        = string
  description = "SSO authorization endpoint"
}

variable "sso_discovery_endpoint" {
  type        = string
  description = "SSO discovery endpoint"
}

variable "sso_token_endpoint" {
  type        = string
  description = "SSO token endpoint"
}

variable "sso_jwks_endpoint" {
  type        = string
  description = "SSO JWKS endpoint"
}

# Mail configuration
variable "resend_sender_email" {
  type        = string
  description = "Sender email for Resend"
}

variable "resend_api_key" {
  type        = string
  description = "Resend API key"
  sensitive   = true
}

# Application configuration
variable "encryption_key" {
  type        = string
  description = "Encryption key for sensitive data (64 chars)"
  sensitive   = true
}

variable "use_cloudflare_r2" {
  type        = bool
  description = "Enable Cloudflare R2 usage"
}

variable "cloudflare_access_key_id" {
  type        = string
  description = "Cloudflare access key id"
  sensitive   = true
}

variable "cloudflare_secret_access_key" {
  type        = string
  description = "Cloudflare secret access key"
  sensitive   = true
}

variable "r2_endpoint" {
  type        = string
  description = "Cloudflare R2 endpoint"
}

# AI models
variable "embeddings_model" {
  type        = string
  description = "Embeddings model"
}

variable "llm_models" {
  type        = string
  description = "Comma-separated list of allowed LLM models"
}

# AWS specific configuration
variable "aws_project_name" {
  type        = string
  description = "AWS project name"
}

variable "aws_region" {
  type        = string
  description = "AWS region"
}
