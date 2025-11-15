provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.aws_project_name
      Environment = "production"
      ManagedBy   = "Terraform"
    }
  }
}

# Provider configuration
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.18"
    }
  }
  required_version = ">= 1.0"

  # Backend configuration for state storage
  # backend "s3" {
  #   bucket         = "your-terraform-state-bucket"
  #   key            = "aws/2-db-storage/terraform.tfstate"
  #   region         = "us-east-1"
  #   dynamodb_table = "terraform-state-lock"
  #   encrypt        = true
  # }
}

# Data source to import state from 1-repository
data "terraform_remote_state" "repository" {
  backend = "local" # Change to "s3" if using remote backend

  config = {
    path = "../1-repository/terraform.tfstate"
    # For S3 backend, use:
    # bucket = "your-terraform-state-bucket"
    # key    = "aws/1-repository/terraform.tfstate"
    # region = "us-east-1"
  }
}
