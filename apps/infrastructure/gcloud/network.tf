# Enable Service Networking API
resource "google_project_service" "servicenetworking" {
  project = var.project_id
  service = "servicenetworking.googleapis.com"
}

# VPC Network for private communication
resource "google_compute_network" "private_network" {
  name                    = "backend-vpc"
  project                 = var.project_id
  auto_create_subnetworks = false
}

# Subnet for the VPC
resource "google_compute_subnetwork" "private_subnet" {
  name          = "backend-subnet"
  project       = var.project_id
  region        = var.gcp_region
  network       = google_compute_network.private_network.id
  ip_cidr_range = "10.0.0.0/24"
}

# Reserve IP range for private services
resource "google_compute_global_address" "private_ip_address" {
  name          = "backend-private-ip"
  project       = var.project_id
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.private_network.id

  depends_on = [
    google_project_service.servicenetworking,
  ]
}

# Create private connection for services
resource "google_service_networking_connection" "private_vpc_connection" {
  network                 = google_compute_network.private_network.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_address.name]

  depends_on = [
    google_project_service.servicenetworking,
  ]
}

