# Import outputs from 2-db-storage step using terraform remote state
data "terraform_remote_state" "db_storage" {
  backend = "local"

  config = {
    path = "../2-db-storage/terraform.tfstate"
  }
}

# Import outputs from 1-repository step using terraform remote state
data "terraform_remote_state" "repository" {
  backend = "local"

  config = {
    path = "../1-repository/terraform.tfstate"
  }
}

# Data sources to reference resources from 2-db-storage
data "aws_vpc" "main" {
  id = data.terraform_remote_state.db_storage.outputs.vpc_id
}

data "aws_security_group" "ecs_tasks" {
  id = data.terraform_remote_state.db_storage.outputs.security_group_ecs_tasks_id
}

data "aws_secretsmanager_secret" "db_password" {
  arn = data.terraform_remote_state.db_storage.outputs.db_password_secret_arn
}

# ECR repository URLs from 1-repository
locals {
  # From 2-db-storage
  vpc_id                = data.terraform_remote_state.db_storage.outputs.vpc_id
  private_subnet_ids    = data.terraform_remote_state.db_storage.outputs.private_subnet_ids
  public_subnet_ids     = data.terraform_remote_state.db_storage.outputs.public_subnet_ids
  postgres_endpoint     = data.terraform_remote_state.db_storage.outputs.postgres_endpoint
  redis_endpoint        = data.terraform_remote_state.db_storage.outputs.redis_endpoint
  redis_address         = data.terraform_remote_state.db_storage.outputs.redis_address
  redis_port            = data.terraform_remote_state.db_storage.outputs.redis_port
  redis_url             = "redis://${local.redis_address}:${local.redis_port}"
  security_group_ecs_id = data.terraform_remote_state.db_storage.outputs.security_group_ecs_tasks_id

  # From 1-repository
  ecr_api_url                   = data.terraform_remote_state.repository.outputs.ecr_api_repository_url
  ecr_document_processor_url    = data.terraform_remote_state.repository.outputs.ecr_document_processor_repository_url
  ecr_pdf_exporter_url          = data.terraform_remote_state.repository.outputs.ecr_pdf_exporter_repository_url
  ecr_firecrawl_api_url         = data.terraform_remote_state.repository.outputs.ecr_firecrawl_api_repository_url
  ecr_firecrawl_playwright_url  = data.terraform_remote_state.repository.outputs.ecr_firecrawl_playwright_repository_url
}
