# ========================================
# DNS CONFIGURATION
# ========================================
output "dns_a_record" {
  description = "Add this A record to your DNS"
  value = {
    type  = "A"
    name  = "api.${var.site_url}"
    value = google_compute_global_address.lb_ip.address
  }
}

# ========================================
# Load Balancer Outputs
# ========================================
output "load_balancer_ip" {
  description = "The IP address of the load balancer"
  value       = google_compute_global_address.lb_ip.address
}

output "api_url" {
  description = "The URL of the API service"
  value       = "https://api.${var.site_url}"
}

# ========================================
# Service URLs
# ========================================
output "api_service_name" {
  description = "The name of the API Cloud Run service"
  value       = google_cloud_run_v2_service.api.name
}

output "document_processor_service_name" {
  description = "The name of the Document Processor Cloud Run service"
  value       = google_cloud_run_v2_service.document_processor.name
}

output "pdf_exporter_service_name" {
  description = "The name of the PDF Exporter Cloud Run service"
  value       = google_cloud_run_v2_service.pdf_exporter.name
}

# ========================================
# Service Account Emails
# ========================================
output "api_sa_email" {
  description = "The email of the API service account"
  value       = google_service_account.api_sa.email
}

output "document_processor_sa_email" {
  description = "The email of the Document Processor service account"
  value       = google_service_account.document_processor_sa.email
}

output "pdf_exporter_sa_email" {
  description = "The email of the PDF Exporter service account"
  value       = google_service_account.pdf_exporter_sa.email
}

# ========================================
# SETUP INSTRUCTIONS
# ========================================
output "setup_instructions" {
  description = "Follow these steps to complete deployment"
  value       = <<-EOT
    
   1️⃣ Add DNS A Record
     terraform output dns_a_record
     → Add to your DNS provider
     → Points api.${var.site_url} to ${google_compute_global_address.lb_ip.address}

   ✅ SSL certificates are automatically managed by Google after DNS is configured
    
  EOT
}
