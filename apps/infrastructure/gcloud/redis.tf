# Enable Cloud Memorystore for Redis API
resource "google_project_service" "redis" {
  project = var.project_id
  service = "redis.googleapis.com"
}

# Redis Instance
resource "google_redis_instance" "redis" {
  name           = "redis"
  tier           = "BASIC"
  memory_size_gb = 1
  project        = var.project_id
  region         = var.region
  redis_version  = "REDIS_7_X"

  authorized_network = google_compute_network.private_network.id

  depends_on = [google_project_service.redis]
}
