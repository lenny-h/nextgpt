variable "site_url" {
  type        = string
  description = "Site URL (e.g. example.com)"
}

variable "google_vertex_project" {
  type        = string
  description = "GCP project ID"
}

variable "google_vertex_location" {
  type        = string
  description = "GCP region"
}
