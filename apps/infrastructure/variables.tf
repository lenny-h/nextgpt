# Variables
variable "project_id" {
  description = "The GCP project ID"
  type        = string
}

variable "region" {
  description = "The GCP region"
  type        = string
  default     = "us-central1"
}

variable "zone" {
  description = "The GCP zone"
  type        = string
  default     = "us-central1-a"
}

variable "db_password" {
  description = "The database password"
  type        = string
  sensitive   = true
}

variable "encryption_key" {
  description = "The encryption key for the database"
  type        = string
  sensitive   = true
}

variable "site_url" {
  description = "The site URL for authentication redirects"
  type        = string
}

variable "disable_signup" {
  description = "Whether to disable user signup"
  type        = string
  default     = "false"
}

# Email configuration
variable "enable_email_signup" {
  description = "Enable email signup"
  type        = string
  default     = "false"
}

variable "allowed_email_domains" {
  description = "Allowed email domains for authentication. Leave empty to allow all domains."
  type        = string
}

# Cloudflare Configuration
variable "cloudflare_api_token" {
  description = "Cloudflare API token"
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare account ID"
  type        = string
}

# Cloudflare R2 Configuration
variable "r2_location" {
  description = "Cloudflare R2 bucket location"
  type        = string
}

variable "cloudflare_r2_access_key_id" {
  description = "Cloudflare R2 access key ID"
  type        = string
  sensitive   = true
}

variable "cloudflare_r2_secret_access_key" {
  description = "Cloudflare R2 secret access key"
  type        = string
  sensitive   = true
}

variable "resend_api_key" {
  description = "Resend API key for email"
  type        = string
  sensitive   = true
}

variable "resend_sender_email" {
  description = "Resend sender email"
  type        = string
}

variable "better_auth_secret" {
  description = "Better Auth secret"
  type        = string
  sensitive   = true
}

variable "embeddings_model" {
  description = "The embeddings model to use"
  type        = string
  default     = "text-embedding-004"
}
