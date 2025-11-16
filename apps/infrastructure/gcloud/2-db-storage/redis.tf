# Enable Cloud Memorystore for Redis API
resource "google_project_service" "redis" {
  project = var.google_vertex_project
  service = "redis.googleapis.com"
}

# Redis Instance
resource "google_redis_instance" "redis" {
  name           = "redis"
  tier           = "BASIC"
  memory_size_gb = 1
  project        = var.google_vertex_project
  region         = var.google_vertex_location
  redis_version  = "REDIS_7_2"

  authorized_network = google_compute_network.private_network.id

  transit_encryption_mode = "SERVER_AUTHENTICATION"

  maintenance_policy {
    weekly_maintenance_window {
      day = "SUNDAY"
      start_time {
        hours   = 2
        minutes = 0
      }
    }
  }

  depends_on = [google_project_service.redis]
}
