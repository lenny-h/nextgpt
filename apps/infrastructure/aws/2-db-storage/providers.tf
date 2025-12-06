# Provider configuration
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

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.25"
    }
  }
  required_version = ">= 1.0"

  # Uncomment the following block to use S3 remote state management
  # backend "s3" {
  #   bucket         = "your-project-terraform-state"
  #   key            = "terraform/state/2-db-storage/terraform.tfstate"
  #   region         = "us-east-1"
  #   dynamodb_table = "terraform-state-lock"
  #   encrypt        = true
  # }
}

# Data source to get current AWS account ID
data "aws_caller_identity" "current" {}

# Data source to import state from 1-repository
data "terraform_remote_state" "repository" {
  backend = "local"

  config = {
    path = "../1-repository/terraform.tfstate"
  }
}

# Uncomment the following block to use S3 remote state
# data "terraform_remote_state" "repository" {
#   backend = "s3"
#
#   config = {
#     bucket = "your-project-terraform-state"
#     key    = "terraform/state/1-repository/terraform.tfstate"
#     region = "us-east-1"
#   }
# }
