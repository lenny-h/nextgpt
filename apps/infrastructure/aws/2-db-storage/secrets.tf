# AWS Secrets Manager secret for database password
resource "aws_secretsmanager_secret" "db_password" {
  name        = "${var.aws_project_name}-db-password"
  description = "PostgreSQL database password"

  tags = {
    Name = "${var.aws_project_name}-db-password"
  }
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = var.database_password
}
