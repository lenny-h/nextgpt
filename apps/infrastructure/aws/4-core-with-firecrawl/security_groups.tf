# Security Group for ALB
resource "aws_security_group" "alb" {
  name        = "${var.aws_project_name}-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = data.terraform_remote_state.db_storage.outputs.vpc_id

  ingress {
    description = "HTTP from internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.aws_project_name}-alb-sg"
  }
}

# Update ECS tasks security group to allow ALB traffic
resource "aws_security_group_rule" "ecs_tasks_from_alb" {
  type                     = "ingress"
  from_port                = 8080
  to_port                  = 8080
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.alb.id
  security_group_id        = data.terraform_remote_state.db_storage.outputs.security_group_ecs_tasks_id
  description              = "Allow traffic from ALB"
}

# Update Redis security group to allow ECS tasks access
resource "aws_security_group_rule" "redis_from_ecs_tasks" {
  type                     = "ingress"
  from_port                = 6379
  to_port                  = 6379
  protocol                 = "tcp"
  source_security_group_id = data.terraform_remote_state.db_storage.outputs.security_group_ecs_tasks_id
  security_group_id        = data.terraform_remote_state.db_storage.outputs.security_group_redis_id
  description              = "Redis from ECS tasks"
}

# Security Group for Firecrawl Services (internal only)
resource "aws_security_group" "firecrawl_services" {
  name        = "${var.aws_project_name}-firecrawl-sg"
  description = "Security group for Firecrawl services (API and Playwright)"
  vpc_id      = data.terraform_remote_state.db_storage.outputs.vpc_id

  # Allow API service to access Firecrawl API
  ingress {
    description     = "Allow traffic from API service"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [data.terraform_remote_state.db_storage.outputs.security_group_ecs_tasks_id]
  }

  # Allow Firecrawl API to access Firecrawl Playwright
  ingress {
    description = "Allow traffic between Firecrawl services"
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    self        = true
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.aws_project_name}-firecrawl-sg"
  }
}

# Update RDS security group to allow Firecrawl access
resource "aws_security_group_rule" "rds_from_firecrawl" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.firecrawl_services.id
  security_group_id        = data.terraform_remote_state.db_storage.outputs.security_group_rds_id
  description              = "PostgreSQL from Firecrawl services"
}
