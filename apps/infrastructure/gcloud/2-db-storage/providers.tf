# Provider configuration
provider "google" {
  project = var.google_vertex_project
  region  = var.google_vertex_location
  zone    = var.google_zone
}

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 7.2"
    }
  }
  required_version = ">= 1.0"
}

# Enable required APIs
resource "google_project_service" "sqladmin" {
  project            = var.google_vertex_project
  service            = "sqladmin.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "redis" {
  project            = var.google_vertex_project
  service            = "redis.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "servicenetworking" {
  project            = var.google_vertex_project
  service            = "servicenetworking.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "run" {
  project            = var.google_vertex_project
  service            = "run.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "secretmanager_api" {
  service            = "secretmanager.googleapis.com"
  project            = var.google_vertex_project
  disable_on_destroy = false
}
