# Provider configuration
provider "google" {
  project = var.google_vertex_project
  region  = var.google_vertex_location
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

# Import service accounts from 3-core
data "terraform_remote_state" "core" {
  backend = "local"

  config = {
    path = "../3-core/terraform.tfstate"
  }
}
