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
      version = "~> 6.22"
    }
  }
  required_version = ">= 1.0"

  # Uncomment the following block to use S3 remote state management
  # backend "s3" {
  #   bucket         = "your-project-terraform-state"
  #   key            = "terraform/state/5-core-with-certificate/terraform.tfstate"
  #   region         = "us-east-1"
  #   dynamodb_table = "terraform-state-lock"
  #   encrypt        = true
  # }
}

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

# Data source to import state from 2-db-storage
data "terraform_remote_state" "db_storage" {
  backend = "local"

  config = {
    path = "../2-db-storage/terraform.tfstate"
  }
}

# Uncomment the following block to use S3 remote state
# data "terraform_remote_state" "db_storage" {
#   backend = "s3"
#
#   config = {
#     bucket = "your-project-terraform-state"
#     key    = "terraform/state/2-db-storage/terraform.tfstate"
#     region = "us-east-1"
#   }
# }

# Data source to import state from 3-core (or 4-core-with-firecrawl)
# Update the path/key based on which core you deployed
data "terraform_remote_state" "core" {
  backend = "local"

  config = {
    path = "../3-core/terraform.tfstate" # Update to ../4-core-with-firecrawl/terraform.tfstate if using Firecrawl
  }
}

# Uncomment the following block to use S3 remote state
# Update the key to match your core deployment (3-core or 4-core-with-firecrawl)
# data "terraform_remote_state" "core" {
#   backend = "s3"
#
#   config = {
#     bucket = "your-project-terraform-state"
#     key    = "terraform/state/3-core/terraform.tfstate"
#     region = "us-east-1"
#   }
# }
