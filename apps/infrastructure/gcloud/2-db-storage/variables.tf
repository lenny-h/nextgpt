variable "google_vertex_project" {
  type        = string
  description = "GCP project ID"
}

variable "google_vertex_location" {
  type        = string
  description = "GCP region"
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
