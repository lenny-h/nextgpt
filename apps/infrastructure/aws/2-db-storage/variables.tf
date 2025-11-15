variable "aws_project_name" {
  type        = string
  description = "AWS project name"
}

variable "aws_region" {
  type        = string
  description = "AWS region"
}

variable "aws_zone" {
  type        = string
  description = "List of AWS availability zones"
}

variable "database_password" {
  type        = string
  description = "Database password"
  sensitive   = true
}
