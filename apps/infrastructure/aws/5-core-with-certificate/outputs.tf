output "ecs_service_api_name" {
  description = "API ECS service name"
  value       = aws_ecs_service.api.name
}

output "ecs_service_pdf_exporter_name" {
  description = "PDF Exporter ECS service name"
  value       = aws_ecs_service.pdf_exporter.name
}

output "setup_instructions" {
  description = "Follow these steps to complete deployment"
  value       = <<-EOT
    ✅ Certificate Validation & HTTPS Listener Configured!
    
    The HTTPS listener and public services (API, PDF Exporter) are now deployed.
    Your application should be accessible via HTTPS.
  EOT
}
