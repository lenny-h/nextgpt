output "vpc_id" {
  description = "The ID of the VPC"
  value       = aws_vpc.main.id
}

output "alb_dns_name" {
  description = "The DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "The zone ID of the load balancer"
  value       = aws_lb.main.zone_id
}

output "database_endpoint" {
  description = "The endpoint of the RDS instance"
  value       = aws_db_instance.postgres.endpoint
}

output "redis_endpoint" {
  description = "The endpoint of the ElastiCache cluster"
  value       = "${aws_elasticache_cluster.redis.cache_nodes[0].address}:${aws_elasticache_cluster.redis.cache_nodes[0].port}"
}

output "ecr_repository_url_api" {
  description = "The URL of the API ECR repository"
  value       = aws_ecr_repository.api.repository_url
}

output "ecr_repository_url_document_processor" {
  description = "The URL of the Document Processor ECR repository"
  value       = aws_ecr_repository.document_processor.repository_url
}

output "ecr_repository_url_pdf_exporter" {
  description = "The URL of the PDF Exporter ECR repository"
  value       = aws_ecr_repository.pdf_exporter.repository_url
}

output "s3_bucket_name" {
  description = "The name of the S3 bucket for temporary files"
  value       = aws_s3_bucket.temporary_files.bucket
}

output "sqs_queue_url" {
  description = "The URL of the SQS queue for document processing"
  value       = aws_sqs_queue.document_processing.url
}

output "sqs_queue_arn" {
  description = "The ARN of the SQS queue for document processing"
  value       = aws_sqs_queue.document_processing.arn
}

output "eventbridge_scheduler_group" {
  description = "The name of the EventBridge Scheduler group"
  value       = aws_scheduler_schedule_group.tasks.name
}

output "eventbridge_scheduler_role_arn" {
  description = "The ARN of the IAM role for EventBridge Scheduler"
  value       = aws_iam_role.eventbridge_scheduler.arn
}

output "ecs_cluster_name" {
  description = "The name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "acm_certificate_validation" {
  description = "DNS records required for ACM certificate validation"
  value = {
    for dvo in aws_acm_certificate.main.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      type   = dvo.resource_record_type
      record = dvo.resource_record_value
    }
  }
}
