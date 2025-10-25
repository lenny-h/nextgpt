# Cloud Armor security policy for DDoS protection -------------------------------------------------

resource "google_compute_security_policy" "armor_policy" {
  name = "armor-policy"
  rule {
    action   = "rate_based_ban"
    priority = "1000"
    match {
      expr {
        expression = "true"
      }
    }
    rate_limit_options {
      conform_action = "allow"
      exceed_action  = "deny(429)"
      rate_limit_threshold {
        count        = 100
        interval_sec = 600
      }
    }
    description = "Rate limit requests to 100 per 10 minutes"
  }
}

# Serverless NEGs for Cloud Run services ----------------------------------------------------------

resource "google_compute_region_network_endpoint_group" "api_neg" {
  name                  = "api-neg"
  network_endpoint_type = "SERVERLESS"
  region                = var.gcp_region
  cloud_run {
    service = google_cloud_run_v2_service.api.name
  }
}

resource "google_compute_region_network_endpoint_group" "pdf_exporter_neg" {
  name                  = "pdf-exporter-neg"
  network_endpoint_type = "SERVERLESS"
  region                = var.gcp_region
  cloud_run {
    service = google_cloud_run_v2_service.pdf_exporter.name
  }
}

# Backend services --------------------------------------------------------------------------------

resource "google_compute_backend_service" "api_backend" {
  name                  = "api-backend"
  protocol              = "HTTP"
  port_name             = "http"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  backend {
    group = google_compute_region_network_endpoint_group.api_neg.id
  }
  security_policy = google_compute_security_policy.armor_policy.name
}

resource "google_compute_backend_service" "pdf_exporter_backend" {
  name                  = "pdf-exporter-backend"
  protocol              = "HTTP"
  port_name             = "http"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  backend {
    group = google_compute_region_network_endpoint_group.pdf_exporter_neg.id
  }
  security_policy = google_compute_security_policy.armor_policy.name
}

# URL map -----------------------------------------------------------------------------------------

resource "google_compute_url_map" "url_map" {
  name = "url-map"

  default_service = google_compute_backend_service.api_backend.id

  host_rule {
    hosts        = ["api.${var.site_url}"]
    path_matcher = "api-path-matcher"
  }

  path_matcher {
    name            = "api-path-matcher"
    default_service = google_compute_backend_service.api_backend.id # Default for api.mydomain.com

    path_rule {
      paths   = ["/api/*"]
      service = google_compute_backend_service.api_backend.id
    }

    path_rule {
      paths   = ["/pdf-exporter/*"]
      service = google_compute_backend_service.pdf_exporter_backend.id
    }
  }
}

# HTTPS Load Balancer -----------------------------------------------------------------------------

# Global external IP address
resource "google_compute_global_address" "lb_ip" {
  name = "lb-ip"
}

# Managed SSL certificate
resource "google_compute_managed_ssl_certificate" "ssl_certificate" {
  name = "managed-cert"
  managed {
    domains = ["api.${var.site_url}"]
  }
}

# Target HTTPS proxy
resource "google_compute_target_https_proxy" "https_proxy" {
  name             = "https-proxy"
  url_map          = google_compute_url_map.url_map.id
  ssl_certificates = [google_compute_managed_ssl_certificate.ssl_certificate.id]
}

# Forwarding rule for HTTPS
resource "google_compute_global_forwarding_rule" "https_forwarding_rule" {
  name                  = "https-forwarding-rule"
  target                = google_compute_target_https_proxy.https_proxy.id
  port_range            = "443"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  ip_address            = google_compute_global_address.lb_ip.address
}

# HTTP to HTTPS Redirect --------------------------------------------------------------------------

# URL map for HTTP to HTTPS redirect
resource "google_compute_url_map" "http_redirect_url_map" {
  name = "http-redirect-url-map"
  default_url_redirect {
    https_redirect         = true
    strip_query            = false
    redirect_response_code = "MOVED_PERMANENTLY_DEFAULT"
  }
}

# Target HTTP proxy for redirect
resource "google_compute_target_http_proxy" "http_redirect_proxy" {
  name    = "http-redirect-proxy"
  url_map = google_compute_url_map.http_redirect_url_map.id
}

# Forwarding rule for HTTP to HTTPS redirect
resource "google_compute_global_forwarding_rule" "http_forwarding_rule" {
  name                  = "http-forwarding-rule"
  target                = google_compute_target_http_proxy.http_redirect_proxy.id
  port_range            = "80"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  ip_address            = google_compute_global_address.lb_ip.address
}

# IAM bindings for load balancer to invoke Cloud Run services ------------------------------------

# Allow Cloud Load Balancing to invoke API service
resource "google_cloud_run_v2_service_iam_binding" "api_lb_invoker" {
  project  = var.project_id
  location = var.gcp_region
  name     = google_cloud_run_v2_service.api.name
  role     = "roles/run.invoker"
  members = [
    "serviceAccount:service-${var.project_id}@gcp-gae-service.iam.gserviceaccount.com",
  ]
}

# Allow Cloud Load Balancing to invoke PDF Exporter service
resource "google_cloud_run_v2_service_iam_binding" "pdf_exporter_lb_invoker" {
  project  = var.project_id
  location = var.gcp_region
  name     = google_cloud_run_v2_service.pdf_exporter.name
  role     = "roles/run.invoker"
  members = [
    "serviceAccount:service-${var.project_id}@gcp-gae-service.iam.gserviceaccount.com",
  ]
}
