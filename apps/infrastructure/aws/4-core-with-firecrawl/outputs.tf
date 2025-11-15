# ========================================
# DNS CONFIGURATION
# ========================================
# Add these to your DNS provider (Cloudflare, Route53, etc.)

output "dns_ssl_validation" {
  description = "Add these DNS records to validate your SSL certificate"
  value = {
    for dvo in aws_acm_certificate.main.domain_validation_options : dvo.domain_name => {
      type  = dvo.resource_record_type
      name  = dvo.resource_record_name
      value = dvo.resource_record_value
    }
  }
}

output "dns_cname_record" {
  description = "Add this CNAME record to your DNS"
  value = {
    type  = "CNAME"
    name  = "api.${var.site_url}"
    value = aws_lb.main.dns_name
  }
}

# ========================================
# GITHUB VARIABLES
# ========================================
# Settings > Secrets and variables > Actions > Variables

output "github_variables" {
  description = "Add these as GitHub repository variables"
  value = {
    AWS_REGION         = var.aws_region
    AWS_PROJECT_NAME   = var.aws_project_name
    AWS_ROLE_TO_ASSUME = aws_iam_role.github_actions.arn
  }
}

# ========================================
# SETUP INSTRUCTIONS
# ========================================

output "setup_instructions" {
  description = "Follow these steps to complete deployment"
  value       = <<-EOT
    
    📋 DEPLOYMENT SETUP
    
    1️⃣ Add DNS Records (Required for SSL)
       terraform output dns_ssl_validation
       → Add these records to your DNS provider
       → Wait 5-10 minutes for validation
    
    2️⃣ Add DNS CNAME
       terraform output dns_cname_record
       → Points api.${var.site_url} to your load balancer
    
    3️⃣ Configure GitHub Variables
       terraform output github_variables
       → Add to: Settings > Secrets and variables > Actions > Variables
    
    ✅ SSL certificates are automatically managed by AWS ACM after validation
    
  EOT
}

