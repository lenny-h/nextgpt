# Provider configuration
provider "google" {
  project = var.google_vertex_project
  region  = var.google_vertex_location
  zone    = var.google_zone
}

# Cloudflare provider
provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# Provider for time resource
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 7.2"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.9"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.7"
    }
    http = {
      source  = "hashicorp/http"
      version = "~> 3.5"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.2"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.5"
    }
    time = {
      source  = "hashicorp/time"
      version = "~> 0.13"
    }
  }
  required_version = ">= 1.0"
}
