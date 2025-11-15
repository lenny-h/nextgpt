# Load Balancer
output "load_balancer_dns_name" {
  description = "Load balancer DNS name"
  value       = aws_lb.main.dns_name
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

# ECS Services
output "ecs_service_api_name" {
  description = "API ECS service name"
  value       = aws_ecs_service.api.name
}

output "ecs_service_document_processor_name" {
  description = "Document Processor ECS service name"
  value       = aws_ecs_service.document_processor.name
}

output "ecs_service_pdf_exporter_name" {
  description = "PDF Exporter ECS service name"
  value       = aws_ecs_service.pdf_exporter.name
}

# SQS
output "sqs_queue_url" {
  description = "SQS queue URL for document processing"
  value       = aws_sqs_queue.document_processing.url
}

# S3
output "s3_temporary_files_bucket" {
  description = "S3 bucket for temporary files"
  value       = aws_s3_bucket.temporary_files.bucket
}

# IAM Roles
output "github_actions_role_arn" {
  description = "GitHub Actions IAM role ARN"
  value       = aws_iam_role.github_actions.arn
}

output "api_task_role_arn" {
  description = "API task role ARN"
  value       = aws_iam_role.api_task.arn
}

output "document_processor_task_role_arn" {
  description = "Document Processor task role ARN"
  value       = aws_iam_role.document_processor_task.arn
}
