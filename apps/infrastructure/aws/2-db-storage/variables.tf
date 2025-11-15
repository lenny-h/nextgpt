variable "aws_project_name" {
  type        = string
  description = "Project name used for resource naming"
}

variable "aws_region" {
  type        = string
  description = "AWS region"
}

variable "aws_zones" {
  type        = string
  description = "Comma-separated AWS zones"
}

variable "database_password" {
  type        = string
  description = "Database password"
  sensitive   = true
}
