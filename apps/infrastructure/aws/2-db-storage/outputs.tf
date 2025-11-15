output "vpc_id" {
  value       = aws_vpc.main.id
  description = "VPC ID"
}

output "private_subnet_ids" {
  value       = aws_subnet.private[*].id
  description = "Private subnet IDs"
}

output "public_subnet_ids" {
  value       = aws_subnet.public[*].id
  description = "Public subnet IDs"
}

output "postgres_endpoint" {
  value       = aws_db_instance.postgres.endpoint
  description = "PostgreSQL endpoint"
}

output "postgres_address" {
  value       = aws_db_instance.postgres.address
  description = "PostgreSQL address"
}

output "redis_endpoint" {
  value       = "${aws_elasticache_cluster.redis.cache_nodes[0].address}:${aws_elasticache_cluster.redis.cache_nodes[0].port}"
  description = "Redis endpoint"
}

output "redis_address" {
  value       = aws_elasticache_cluster.redis.cache_nodes[0].address
  description = "Redis address"
}

output "redis_port" {
  value       = aws_elasticache_cluster.redis.cache_nodes[0].port
  description = "Redis port"
}

output "db_password_secret_arn" {
  value       = aws_secretsmanager_secret.db_password.arn
  description = "ARN of database password secret"
}

output "db_migrator_execution_role_arn" {
  value       = aws_iam_role.db_migrator_execution.arn
  description = "ARN of DB migrator execution role"
}

output "db_migrator_task_role_arn" {
  value       = aws_iam_role.db_migrator_task.arn
  description = "ARN of DB migrator task role"
}

output "security_group_ecs_tasks_id" {
  value       = aws_security_group.ecs_tasks.id
  description = "Security group ID for ECS tasks"
}

output "security_group_postgres_id" {
  value       = aws_security_group.postgres.id
  description = "Security group ID for PostgreSQL"
}

output "security_group_redis_id" {
  value       = aws_security_group.redis.id
  description = "Security group ID for Redis"
}
