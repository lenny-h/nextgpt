# Variables

variable "site_url" {
  description = "The domain of the site (e.g., example.com)"
  type        = string
}

variable "subscription_id" {
  description = "Azure subscription ID"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "eastus"
}

variable "resource_group_name" {
  description = "Resource group name"
  type        = string
  default     = "nextgpt-rg"
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

# Resend email service configuration
variable "resend_sender_email" {
  description = "Resend sender email"
  type        = string
}

variable "resend_api_key" {
  description = "Resend API key for email"
  type        = string
  sensitive   = true
}

# Better Auth configuration
variable "better_auth_secret" {
  description = "Better Auth secret"
  type        = string
  sensitive   = true
}

# Database configuration
variable "db_password" {
  description = "The database password"
  type        = string
  sensitive   = true
}

# Cloudflare Configuration
variable "cloudflare_account_id" {
  description = "Cloudflare account ID"
  type        = string
}

variable "cloudflare_api_token" {
  description = "Cloudflare API token"
  type        = string
  sensitive   = true
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

# Database Encryption Key
variable "encryption_key" {
  description = "The encryption key for the database"
  type        = string
  sensitive   = true
}

# Embeddings Model
variable "embeddings_model" {
  description = "The embeddings model to use"
  type        = string
  default     = "text-embedding-004"
}

# LLM Models
variable "llm_models" {
  description = "The LLM models to use"
  type        = string
  default     = "gpt-4o,gpt-5-mini,gpt-5"
}
