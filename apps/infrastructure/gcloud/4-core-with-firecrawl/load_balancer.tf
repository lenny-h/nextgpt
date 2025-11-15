# Load Balancer for API service
resource "google_compute_global_address" "lb_ip" {
  name = "${var.project_name}-lb-ip"
}

# SSL Certificate
resource "google_compute_managed_ssl_certificate" "lb_cert" {
  name = "${var.project_name}-lb-cert"

  managed {
    domains = [var.domain]
  }
}

# Backend service
resource "google_compute_backend_service" "api_backend" {
  name                  = "${var.project_name}-api-backend"
  protocol              = "HTTP"
  port_name             = "http"
  timeout_sec           = 30
  enable_cdn            = false
  load_balancing_scheme = "EXTERNAL_MANAGED"

  backend {
    group = google_compute_region_network_endpoint_group.api_neg.id
  }

  log_config {
    enable      = true
    sample_rate = 1.0
  }
}

# Network Endpoint Group for Cloud Run
resource "google_compute_region_network_endpoint_group" "api_neg" {
  name                  = "${var.project_name}-api-neg"
  network_endpoint_type = "SERVERLESS"
  region                = var.region

  cloud_run {
    service = google_cloud_run_v2_service.api.name
  }
}

# URL Map
resource "google_compute_url_map" "lb" {
  name            = "${var.project_name}-lb"
  default_service = google_compute_backend_service.api_backend.id
}

# HTTP to HTTPS redirect
resource "google_compute_url_map" "http_redirect" {
  name = "${var.project_name}-http-redirect"

  default_url_redirect {
    https_redirect         = true
    redirect_response_code = "MOVED_PERMANENTLY_DEFAULT"
    strip_query            = false
  }
}

# HTTPS Proxy
resource "google_compute_target_https_proxy" "lb_https" {
  name             = "${var.project_name}-lb-https"
  url_map          = google_compute_url_map.lb.id
  ssl_certificates = [google_compute_managed_ssl_certificate.lb_cert.id]
}

# HTTP Proxy (for redirect)
resource "google_compute_target_http_proxy" "lb_http" {
  name    = "${var.project_name}-lb-http"
  url_map = google_compute_url_map.http_redirect.id
}

# Forwarding Rule - HTTPS
resource "google_compute_global_forwarding_rule" "lb_https" {
  name                  = "${var.project_name}-lb-https"
  ip_protocol           = "TCP"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  port_range            = "443"
  target                = google_compute_target_https_proxy.lb_https.id
  ip_address            = google_compute_global_address.lb_ip.id
}

# Forwarding Rule - HTTP
resource "google_compute_global_forwarding_rule" "lb_http" {
  name                  = "${var.project_name}-lb-http"
  ip_protocol           = "TCP"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  port_range            = "80"
  target                = google_compute_target_http_proxy.lb_http.id
  ip_address            = google_compute_global_address.lb_ip.id
}
