variable "aws_project_name" {
  type        = string
  description = "AWS project name"
}

variable "aws_region" {
  type        = string
  description = "AWS region"
}

variable "site_url" {
  type        = string
  description = "Site URL (e.g. example.com)"
}

variable "cloudflare_account_id" {
  type        = string
  description = "Cloudflare account ID"
}

variable "cloudflare_api_token" {
  type        = string
  description = "Cloudflare API token"
  sensitive   = true
}

variable "r2_location" {
  type        = string
  description = "Cloudflare R2 bucket location"
}
