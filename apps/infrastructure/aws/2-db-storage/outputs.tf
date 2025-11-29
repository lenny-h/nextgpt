# VPC
output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "VPC CIDR block"
  value       = aws_vpc.main.cidr_block
}

# Subnets
output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

# Security Groups
output "security_group_rds_id" {
  description = "RDS security group ID"
  value       = aws_security_group.rds.id
}

output "security_group_redis_id" {
  description = "Redis security group ID"
  value       = aws_security_group.redis.id
}

output "security_group_ecs_tasks_id" {
  description = "ECS tasks security group ID"
  value       = aws_security_group.ecs_tasks.id
}

# Database
output "db_instance_endpoint" {
  description = "PostgreSQL database endpoint"
  value       = aws_db_instance.postgres.endpoint
}

output "db_instance_address" {
  description = "PostgreSQL database address"
  value       = aws_db_instance.postgres.address
}

# Redis
output "redis_endpoint" {
  description = "Redis cluster endpoint"
  value       = "${aws_elasticache_cluster.redis.cache_nodes[0].address}:${aws_elasticache_cluster.redis.cache_nodes[0].port}"
}

output "redis_address" {
  description = "Redis cluster address"
  value       = aws_elasticache_cluster.redis.cache_nodes[0].address
}

output "redis_port" {
  description = "Redis cluster port"
  value       = aws_elasticache_cluster.redis.cache_nodes[0].port
}

# ECS Cluster
output "ecs_cluster_id" {
  description = "ECS cluster ID"
  value       = aws_ecs_cluster.main.id
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

# IAM Roles
output "ecs_task_execution_role_arn" {
  description = "ECS task execution role ARN"
  value       = aws_iam_role.ecs_task_execution.arn
}

output "ecs_task_execution_role_name" {
  description = "ECS task execution role name"
  value       = aws_iam_role.ecs_task_execution.name
}

output "db_migrator_task_role_arn" {
  description = "DB migrator task role ARN"
  value       = aws_iam_role.db_migrator_task.arn
}

# Secrets
output "db_password_secret_arn" {
  description = "Database password secret ARN"
  value       = aws_secretsmanager_secret.db_password.arn
}

# ========================================
# Centralized GitHub Variables + Setup
# ========================================
output "setup_instructions" {
  description = "Follow these steps to configure GitHub actions and secrets using values from this Terraform module."
  value       = <<-EOT

    1️⃣ GitHub Repository Variables
       - Go to: Settings > Secrets and variables > Actions > Variables
       - Add the following variables using values retrieved from Terraform:
         * AWS_PROJECT_NAME = ${var.aws_project_name}
         * AWS_REGION = ${var.aws_region}
         * AWS_ROLE_TO_ASSUME = arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/${var.aws_project_name}-github-actions-role

    ✅ After creating the variables, push to GitHub to trigger the workflows.
  EOT
}
