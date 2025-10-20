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
  default     = "true"
}

variable "enable_email_autoconfirm" {
  description = "Enable email autoconfirm"
  type        = string
  default     = "false"
}

variable "smtp_admin_email" {
  description = "SMTP admin email"
  type        = string
  default     = ""
}

variable "smtp_host" {
  description = "SMTP host"
  type        = string
  default     = ""
}

variable "smtp_port" {
  description = "SMTP port"
  type        = string
  default     = "587"
}

variable "smtp_user" {
  description = "SMTP user"
  type        = string
  default     = ""
}

variable "smtp_pass" {
  description = "SMTP password"
  type        = string
  default     = ""
  sensitive   = true
}

variable "smtp_sender_name" {
  description = "SMTP sender name"
  type        = string
  default     = ""
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

variable "embeddings_model" {
  description = "The embeddings model to use"
  type        = string
  default     = "text-embedding-004"
}
