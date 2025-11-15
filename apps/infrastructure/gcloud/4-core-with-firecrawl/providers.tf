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
  }
  required_version = ">= 1.0"
}

# Data source to import state from 2-db-storage
data "terraform_remote_state" "db_storage" {
  backend = "local"

  config = {
    path = "../2-db-storage/terraform.tfstate"
  }
}
