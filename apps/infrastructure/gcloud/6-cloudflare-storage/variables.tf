variable "cloudflare_account_id" {
  type        = string
  description = "Cloudflare account id"
}

variable "cloudflare_api_token" {
  type        = string
  description = "Cloudflare API token"
  sensitive   = true
}

variable "r2_location" {
  type        = string
  description = "Cloudflare R2 location"
}
