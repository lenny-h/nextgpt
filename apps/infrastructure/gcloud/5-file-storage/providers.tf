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
  #   prefix = "terraform/state/5-file-storage"
  # }
}

# Import service accounts from 3-core
data "terraform_remote_state" "core" {
  backend = "local"

  config = {
    path = "../3-core/terraform.tfstate" # Update the path if using 4-core-with-firecrawl
  }
}

# Uncomment the following block to use GCS remote state
# Update the prefix to match your core deployment (3-core or 4-core-with-firecrawl)
# data "terraform_remote_state" "core" {
#   backend = "gcs"
#
#   config = {
#     bucket = "your-project-terraform-state"
#     prefix = "terraform/state/3-core"
#   }
# }
