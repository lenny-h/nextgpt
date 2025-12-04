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

output "document_processor_job_name" {
  description = "The name of the Document Processor Cloud Run Job"
  value       = google_cloud_run_v2_job.document_processor.name
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
     → Add this A record to your domain's DNS settings
     → Points api.${var.site_url} to ${google_compute_global_address.lb_ip.address}
     → SSL certificates are automatically managed by Google after DNS is configured

   2️⃣ GitHub Repository Variables & Secrets (for Frontend Deployment)
     Go to: Settings → Secrets and variables → Actions
     
     Variables (Repository variables):
     ✓ SITE_URL = ${var.site_url}
     ✓ ENABLE_EMAIL_SIGNUP = ${var.enable_email_signup}
     ✓ ENABLE_OAUTH_LOGIN = ${var.enable_oauth_login}
     ✓ ENABLE_SSO = ${var.enable_sso}
     ✓ USE_FIRECRAWL = false
     ✓ CSP_ENDPOINTS = ${var.use_cloudflare_r2 ? "https://files-bucket.<your-account-id>.r2.cloudflarestorage.com https://temporary-files-bucket.<your-account-id>.r2.cloudflarestorage.com" : "https://storage.googleapis.com"}
     ✓ LLM_MODELS = ${var.llm_models}
     ✓ PDF_BBOX_DURATION_MS = <your PDF BBox Duration in ms>
     ✓ CLOUDFLARE_ACCOUNT_ID = <your Cloudflare account ID>
     
     Secrets (Repository secrets):
     ✓ CLOUDFLARE_API_TOKEN = <your Cloudflare API token>
     
     → These enable the deploy-frontend.yml workflow to deploy web/dashboard to Cloudflare Workers
  EOT
}
