variable "aws_project_name" {
  type        = string
  description = "AWS project name"
}

variable "aws_region" {
  type        = string
  description = "AWS region"
}

variable "aws_zones" {
  type        = list(string)
  description = "List of AWS availability zones"
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
