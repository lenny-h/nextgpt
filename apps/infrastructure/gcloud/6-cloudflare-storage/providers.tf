terraform {
  required_version = ">= 1.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.10"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.9"
    }
  }

  # For production, use Cloud Storage backend
  # backend "gcs" {
  #   bucket = "your-terraform-state-bucket"
  #   prefix = "terraform/state/6-cloudflare-storage"
  # }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# Import state from previous layers
data "terraform_remote_state" "repository" {
  backend = "local"

  config = {
    path = "../1-repository/terraform.tfstate"
  }
}

data "terraform_remote_state" "db_storage" {
  backend = "local"

  config = {
    path = "../2-db-storage/terraform.tfstate"
  }
}

data "terraform_remote_state" "core" {
  backend = "local"

  config = {
    # Change this to ../4-core-with-firecrawl/terraform.tfstate if you deployed that layer
    path = "../3-core/terraform.tfstate"
  }
}
