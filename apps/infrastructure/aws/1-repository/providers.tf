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
      version = "~> 6.22"
    }
  }
  required_version = ">= 1.0"

  # Backend configuration for state storage
  # Uncomment and configure after creating your S3 bucket and DynamoDB table
  # backend "s3" {
  #   bucket         = "your-terraform-state-bucket"
  #   key            = "aws/1-repository/terraform.tfstate"
  #   region         = "us-east-1"
  #   dynamodb_table = "terraform-state-lock"
  #   encrypt        = true
  # }
}
