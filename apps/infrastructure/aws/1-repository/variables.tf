variable "aws_project_name" {
  type        = string
  description = "AWS project name"
}

variable "aws_region" {
  type        = string
  description = "AWS region"
}

variable "github_repository" {
  type        = string
  description = "GitHub repository in format 'owner/repo' used by CI/CD"
}
