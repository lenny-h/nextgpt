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
    time = {
      source  = "hashicorp/time"
      version = "~> 0.13"
    }
  }
  required_version = ">= 1.0"

  # Uncomment the following block to use GCS remote state management
  # backend "gcs" {
  #   bucket = "your-project-terraform-state"
  #   prefix = "terraform/state/2-db-storage"
  # }
}

# Data source to import state from 1-repository
data "terraform_remote_state" "repository" {
  backend = "local"

  config = {
    path = "../1-repository/terraform.tfstate"
  }
}

# Uncomment the following block to use GCS remote state
# data "terraform_remote_state" "repository" {
#   backend = "gcs"
#
#   config = {
#     bucket = "your-project-terraform-state"
#     prefix = "terraform/state/1-repository"
#   }
# }
