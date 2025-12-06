# Provider configuration
provider "google" {
  project = var.google_vertex_project
  region  = var.google_vertex_location
}

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 7.12"
    }
  }
  required_version = ">= 1.0"

  # Uncomment the following block to use GCS remote state management
  # backend "gcs" {
  #   bucket = "your-project-terraform-state"
  #   prefix = "terraform/state/1-repository"
  # }
}
