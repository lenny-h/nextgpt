# Load Balancer
output "load_balancer_dns_name" {
  description = "Load balancer DNS name"
  value       = aws_lb.main.dns_name
}

output "load_balancer_arn" {
  description = "Load balancer ARN"
  value       = aws_lb.main.arn
}

output "target_group_api_arn" {
  description = "API target group ARN"
  value       = aws_lb_target_group.api.arn
}

output "target_group_pdf_exporter_arn" {
  description = "PDF Exporter target group ARN"
  value       = aws_lb_target_group.pdf_exporter.arn
}

output "encryption_key_secret_arn" {
  description = "Encryption key secret ARN (used for internal service authentication)"
  value       = aws_secretsmanager_secret.encryption_key.arn
}

# SSL Certificate
output "acm_certificate_arn" {
  description = "ACM certificate ARN"
  value       = aws_acm_certificate.main.arn
}

output "dns_validation_records" {
  description = "DNS validation records for SSL certificate"
  value = {
    for dvo in aws_acm_certificate.main.domain_validation_options : dvo.domain_name => {
      type  = dvo.resource_record_type
      name  = dvo.resource_record_name
      value = dvo.resource_record_value
    }
  }
}

# EventBridge Event Bus
output "eventbridge_event_bus_arn" {
  description = "EventBridge Event Bus ARN for document processing"
  value       = aws_cloudwatch_event_bus.document_processing.arn
}

output "eventbridge_event_bus_name" {
  description = "EventBridge Event Bus name for document processing"
  value       = aws_cloudwatch_event_bus.document_processing.name
}

# ECS Task Definitions (services created in layer 5)
output "ecs_task_definition_document_processor_arn" {
  description = "Document Processor task definition ARN"
  value       = aws_ecs_task_definition.document_processor.arn
}

output "service_discovery_document_processor_arn" {
  description = "Document Processor service discovery ARN"
  value       = aws_service_discovery_service.document_processor.arn
}

output "ecs_task_definition_api_arn" {
  description = "API task definition ARN"
  value       = aws_ecs_task_definition.api.arn
}

output "ecs_task_definition_pdf_exporter_arn" {
  description = "PDF Exporter task definition ARN"
  value       = aws_ecs_task_definition.pdf_exporter.arn
}


output "api_task_role_arn" {
  description = "API task role ARN"
  value       = aws_iam_role.api_task.arn
}

output "document_processor_task_role_arn" {
  description = "Document Processor task role ARN"
  value       = aws_iam_role.document_processor_task.arn
}

output "pdf_exporter_task_role_arn" {
  description = "PDF Exporter task role ARN"
  value       = aws_iam_role.pdf_exporter_task.arn
}

# ========================================
# SETUP INSTRUCTIONS
# ========================================
output "setup_instructions" {
  description = "Follow these steps to complete deployment"
  value       = <<-EOT
  
   1️⃣ Add DNS Validation Records (for SSL Certificate)
     terraform output dns_validation_records
     → Add these CNAME records to your DNS provider
     → Required for AWS to issue SSL certificate
     
   2️⃣ Add DNS CNAME Record (for Load Balancer)
     → Add CNAME record: api.${var.site_url} → ${aws_lb.main.dns_name}
     → This points your API domain to the AWS load balancer

   3️⃣ GitHub Repository Variables & Secrets (for Frontend Deployment)
     Go to: Settings → Secrets and variables → Actions
     
     Variables (Repository variables):
     ✓ SITE_URL = ${var.site_url}
     ✓ ENABLE_EMAIL_SIGNUP = ${var.enable_email_signup}
     ✓ ENABLE_OAUTH_LOGIN = ${var.enable_oauth_login}
     ✓ ENABLE_SSO = ${var.enable_sso}
     ✓ USE_FIRECRAWL = false
     ✓ CSP_ENDPOINTS = ${var.use_cloudflare_r2 ? "https://files-bucket.<your-account-id>.r2.cloudflarestorage.com https://temporary-files-bucket.<your-account-id>.r2.cloudflarestorage.com" : "https://${var.aws_project_name}-files-bucket.s3.${var.aws_region}.amazonaws.com https://${var.aws_project_name}-temporary-files-bucket.s3.${var.aws_region}.amazonaws.com"}
     ✓ LLM_MODELS = ${var.llm_models}
     ✓ PDF_BBOX_DURATION_MS = <your PDF BBox Duration in ms>
     ✓ CLOUDFLARE_ACCOUNT_ID = <your Cloudflare account ID>
     
     Secrets (Repository secrets):
     ✓ CLOUDFLARE_API_TOKEN = <your Cloudflare API token>
     
     → These enable the deploy-frontend.yml workflow to deploy web/dashboard to Cloudflare Workers
  EOT
}
