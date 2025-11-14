# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${var.aws_project_name}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "${var.aws_project_name}-db-subnet-group"
  }
}

# RDS PostgreSQL Instance
resource "aws_db_instance" "postgres" {
  identifier     = "${var.aws_project_name}-postgres"
  engine         = "postgres"
  engine_version = "18"
  instance_class = "db.t3.micro"

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = "postgres"
  username = "postgres"
  password = var.database_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  multi_az                  = false
  deletion_protection       = false
  skip_final_snapshot       = true
  final_snapshot_identifier = null

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  tags = {
    Name = "${var.aws_project_name}-postgres"
  }
}
