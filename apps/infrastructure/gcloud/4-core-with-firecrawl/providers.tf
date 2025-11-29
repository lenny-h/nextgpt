# Provider configuration
provider "google" {
  project = var.google_vertex_project
  region  = var.google_vertex_location
}

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 7.11"
    }
  }
  required_version = ">= 1.0"

  # Uncomment the following block to use GCS remote state management
  # backend "gcs" {
  #   bucket = "your-project-terraform-state"
  #   prefix = "terraform/state/4-core-with-firecrawl"
  # }
}

# Data source to import state from 2-db-storage
data "terraform_remote_state" "db_storage" {
  backend = "local"

  config = {
    path = "../2-db-storage/terraform.tfstate"
  }
}

# Uncomment the following block to use GCS remote state
# data "terraform_remote_state" "db_storage" {
#   backend = "gcs"
#
#   config = {
#     bucket = "your-project-terraform-state"
#     prefix = "terraform/state/2-db-storage"
#   }
# }
