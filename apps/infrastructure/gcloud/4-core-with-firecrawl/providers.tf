# Provider configuration
provider "google" {
  project = var.google_vertex_project
  region  = var.google_vertex_location
  zone    = var.google_zone
}

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 7.2"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.7"
    }
    time = {
      source  = "hashicorp/time"
      version = "~> 0.13"
    }
  }
  required_version = ">= 1.0"
}

# Enable required APIs
resource "google_project_service" "run_api" {
  service            = "run.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "compute_api" {
  service            = "compute.googleapis.com"
  disable_on_destroy = false
}
