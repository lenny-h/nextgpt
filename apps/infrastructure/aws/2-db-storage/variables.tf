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
  description = "AWS availability zone"
}

variable "database_password" {
  type        = string
  description = "Database password"
  sensitive   = true
}

variable "use_firecrawl" {
  type        = bool
  description = "Whether to use Firecrawl"
}
