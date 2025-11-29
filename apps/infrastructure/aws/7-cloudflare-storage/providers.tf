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

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.22"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.13"
    }
  }
  required_version = ">= 1.0"

  # Uncomment the following block to use S3 remote state management
  # backend "s3" {
  #   bucket         = "your-project-terraform-state"
  #   key            = "terraform/state/7-cloudflare-storage/terraform.tfstate"
  #   region         = "us-east-1"
  #   dynamodb_table = "terraform-state-lock"
  #   encrypt        = true
  # }
}

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
