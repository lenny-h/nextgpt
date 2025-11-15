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

# Provider configuration
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
    random = {
      source  = "hashicorp/random"
      version = "~> 3.7"
    }
    time = {
      source  = "hashicorp/time"
      version = "~> 0.13"
    }
  }
  required_version = ">= 1.0"
}
