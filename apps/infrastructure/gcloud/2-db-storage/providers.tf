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
    time = {
      source  = "hashicorp/time"
      version = "~> 0.13"
    }
  }
  required_version = ">= 1.0"
}

# Data source to import state from 1-repository
data "terraform_remote_state" "repository" {
  backend = "local"

  config = {
    path = "../1-repository/terraform.tfstate"
  }
}
