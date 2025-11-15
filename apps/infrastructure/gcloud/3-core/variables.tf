variable "project_id" {
  description = "Google Cloud Project ID"
  type        = string
}

variable "region" {
  description = "Google Cloud region"
  type        = string
  default     = "us-central1"
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, production)"
  type        = string
  default     = "production"
}

variable "domain" {
  description = "Domain name for the API (e.g., api.example.com)"
  type        = string
}

variable "api_cpu" {
  description = "CPU allocation for API service"
  type        = string
  default     = "1"
}

variable "api_memory" {
  description = "Memory allocation for API service"
  type        = string
  default     = "512Mi"
}

variable "api_min_instances" {
  description = "Minimum number of API instances"
  type        = number
  default     = 1
}

variable "api_max_instances" {
  description = "Maximum number of API instances"
  type        = number
  default     = 10
}

variable "document_processor_cpu" {
  description = "CPU allocation for Document Processor"
  type        = string
  default     = "2"
}

variable "document_processor_memory" {
  description = "Memory allocation for Document Processor"
  type        = string
  default     = "2Gi"
}

variable "document_processor_min_instances" {
  description = "Minimum number of Document Processor instances"
  type        = number
  default     = 0
}

variable "document_processor_max_instances" {
  description = "Maximum number of Document Processor instances"
  type        = number
  default     = 5
}

variable "pdf_exporter_cpu" {
  description = "CPU allocation for PDF Exporter"
  type        = string
  default     = "1"
}

variable "pdf_exporter_memory" {
  description = "Memory allocation for PDF Exporter"
  type        = string
  default     = "1Gi"
}

variable "pdf_exporter_min_instances" {
  description = "Minimum number of PDF Exporter instances"
  type        = number
  default     = 0
}

variable "pdf_exporter_max_instances" {
  description = "Maximum number of PDF Exporter instances"
  type        = number
  default     = 5
}

# OAuth Configuration
variable "google_client_id" {
  description = "Google OAuth Client ID"
  type        = string
  sensitive   = true
}

variable "google_client_secret" {
  description = "Google OAuth Client Secret"
  type        = string
  sensitive   = true
}

variable "github_client_id" {
  description = "GitHub OAuth Client ID"
  type        = string
  sensitive   = true
}

variable "github_client_secret" {
  description = "GitHub OAuth Client Secret"
  type        = string
  sensitive   = true
}

# Auth Configuration
variable "nextauth_secret" {
  description = "NextAuth secret key"
  type        = string
  sensitive   = true
}

variable "nextauth_url" {
  description = "NextAuth URL"
  type        = string
}

# Encryption
variable "encryption_key" {
  description = "Encryption key for sensitive data"
  type        = string
  sensitive   = true
}
