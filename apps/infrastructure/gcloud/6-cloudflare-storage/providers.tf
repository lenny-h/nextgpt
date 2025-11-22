# Cloudflare provider
provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.13"
    }
  }
  required_version = ">= 1.0"
}
