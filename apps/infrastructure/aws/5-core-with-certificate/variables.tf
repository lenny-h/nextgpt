variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "aws_project_name" {
  description = "Project name used for resource naming"
  type        = string
}

variable "terraform_state_bucket" {
  description = "S3 bucket for Terraform state"
  type        = string
}
