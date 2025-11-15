# ECR Repository URLs
output "ecr_repository_api" {
  description = "API ECR repository URL"
  value       = aws_ecr_repository.api.repository_url
}

output "ecr_repository_document_processor" {
  description = "Document Processor ECR repository URL"
  value       = aws_ecr_repository.document_processor.repository_url
}

output "ecr_repository_pdf_exporter" {
  description = "PDF Exporter ECR repository URL"
  value       = aws_ecr_repository.pdf_exporter.repository_url
}

output "ecr_repository_db_migrator" {
  description = "DB Migrator ECR repository URL"
  value       = aws_ecr_repository.db_migrator.repository_url
}

output "ecr_repository_firecrawl_api" {
  description = "Firecrawl API ECR repository URL"
  value       = aws_ecr_repository.firecrawl_api.repository_url
}

output "ecr_repository_firecrawl_playwright" {
  description = "Firecrawl Playwright ECR repository URL"
  value       = aws_ecr_repository.firecrawl_playwright.repository_url
}

# ECR Repository ARNs
output "ecr_repository_api_arn" {
  description = "API ECR repository ARN"
  value       = aws_ecr_repository.api.arn
}

output "ecr_repository_document_processor_arn" {
  description = "Document Processor ECR repository ARN"
  value       = aws_ecr_repository.document_processor.arn
}

output "ecr_repository_pdf_exporter_arn" {
  description = "PDF Exporter ECR repository ARN"
  value       = aws_ecr_repository.pdf_exporter.arn
}

output "ecr_repository_db_migrator_arn" {
  description = "DB Migrator ECR repository ARN"
  value       = aws_ecr_repository.db_migrator.arn
}

output "ecr_repository_firecrawl_api_arn" {
  description = "Firecrawl API ECR repository ARN"
  value       = aws_ecr_repository.firecrawl_api.arn
}

output "ecr_repository_firecrawl_playwright_arn" {
  description = "Firecrawl Playwright ECR repository ARN"
  value       = aws_ecr_repository.firecrawl_playwright.arn
}

# GitHub Actions OIDC Provider
output "github_actions_oidc_provider_arn" {
  description = "GitHub Actions OIDC provider ARN"
  value       = aws_iam_openid_connect_provider.github_actions.arn
}

# GitHub Actions Role
output "github_actions_role_arn" {
  description = "GitHub Actions IAM role ARN"
  value       = aws_iam_role.github_actions.arn
}

output "github_actions_role_name" {
  description = "GitHub Actions IAM role name"
  value       = aws_iam_role.github_actions.name
}
