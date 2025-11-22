terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    key = "infrastructure/aws/5-core-with-certificate/terraform.tfstate"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.aws_project_name
      Environment = "production"
      ManagedBy   = "terraform"
    }
  }
}

data "terraform_remote_state" "core" {
  backend = "s3"

  config = {
    bucket = var.terraform_state_bucket
    key    = "infrastructure/aws/3-core/terraform.tfstate" # Defaulting to 3-core, user can change if using 4-core
    region = var.aws_region
  }
}

data "terraform_remote_state" "db_storage" {
  backend = "s3"

  config = {
    bucket = var.terraform_state_bucket
    key    = "infrastructure/aws/2-db-storage/terraform.tfstate"
    region = var.aws_region
  }
}
