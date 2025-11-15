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
      version = "~> 6.18"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.9"
    }
  }
  required_version = ">= 1.0"

  # Backend configuration for state storage
  # backend "s3" {
  #   bucket         = "your-terraform-state-bucket"
  #   key            = "aws/6-cloudflare-storage/terraform.tfstate"
  #   region         = "us-east-1"
  #   dynamodb_table = "terraform-state-lock"
  #   encrypt        = true
  # }
}

# Import state from 1-repository
data "terraform_remote_state" "repository" {
  backend = "local"

  config = {
    path = "../1-repository/terraform.tfstate"
  }
}

# Import state from 2-db-storage
data "terraform_remote_state" "db_storage" {
  backend = "local"

  config = {
    path = "../2-db-storage/terraform.tfstate"
  }
}

# Import state from 3-core (or 4-core-with-firecrawl)
# Update the path based on which core you deployed
data "terraform_remote_state" "core" {
  backend = "local"

  config = {
    path = "../3-core/terraform.tfstate"
    # If you deployed 4-core-with-firecrawl, use:
    # path = "../4-core-with-firecrawl/terraform.tfstate"
  }
}
