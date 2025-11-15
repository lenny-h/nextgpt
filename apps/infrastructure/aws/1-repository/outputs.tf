# Individual outputs for easier access via remote state
output "ecr_api_repository_url" {
  description = "URL of the API ECR repository"
  value       = aws_ecr_repository.api.repository_url
}

output "ecr_document_processor_repository_url" {
  description = "URL of the Document Processor ECR repository"
  value       = aws_ecr_repository.document_processor.repository_url
}

output "ecr_pdf_exporter_repository_url" {
  description = "URL of the PDF Exporter ECR repository"
  value       = aws_ecr_repository.pdf_exporter.repository_url
}

output "ecr_firecrawl_api_repository_url" {
  description = "URL of the Firecrawl API ECR repository"
  value       = aws_ecr_repository.firecrawl_api.repository_url
}

output "ecr_firecrawl_playwright_repository_url" {
  description = "URL of the Firecrawl Playwright ECR repository"
  value       = aws_ecr_repository.firecrawl_playwright.repository_url
}
