# ========================================
# DNS CONFIGURATION
# ========================================
# Add this A record to your DNS provider (Cloudflare, etc.)

output "dns_a_record" {
  description = "Add this A record to your DNS"
  value = {
    type  = "A"
    name  = "api.${var.site_url}"
    value = google_compute_global_address.lb_ip.address
  }
}

# ========================================
# GITHUB SECRETS
# ========================================
# Settings > Secrets and variables > Actions > Secrets

output "github_secret" {
  description = "Add this as GCP_SA_KEY secret in GitHub"
  value       = google_service_account_key.ci_cd_sa_key.private_key
  sensitive   = true
}

# ========================================
# GITHUB VARIABLES
# ========================================
# Settings > Secrets and variables > Actions > Variables

output "github_variables" {
  description = "Add these as GitHub repository variables"
  value = {
    PROJECT_ID = var.google_vertex_project
    REGION     = var.google_vertex_location
  }
}

# ========================================
# SETUP INSTRUCTIONS
# ========================================

output "setup_instructions" {
  description = "Follow these steps to complete deployment"
  value       = <<-EOT
    
    📋 DEPLOYMENT SETUP
    
    1️⃣  Add DNS A Record
       terraform output dns_a_record
       → Add to your DNS provider
       → Points api.${var.site_url} to ${google_compute_global_address.lb_ip.address}
    
    2️⃣  Configure GitHub Secret
       terraform output -raw github_secret | base64 -d > sa-key.json
       → Copy contents to: Settings > Secrets > GCP_SA_KEY
       → Delete sa-key.json after copying
    
    3️⃣  Configure GitHub Variables
       terraform output github_variables
       → Add to: Settings > Secrets and variables > Actions > Variables
    
    ✅ SSL certificates are automatically managed by Google after DNS is configured
    
  EOT
}

