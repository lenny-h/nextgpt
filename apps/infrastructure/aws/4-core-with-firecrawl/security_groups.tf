# Security Group for ALB
resource "aws_security_group" "alb" {
  name        = "${var.aws_project_name}-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = local.vpc_id

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

# Security Group for Firecrawl Services (internal only)
# Note: ECS tasks, RDS, and Redis security groups are defined in 2-db-storage
resource "aws_security_group" "firecrawl_services" {
  name        = "${var.aws_project_name}-firecrawl-sg"
  description = "Security group for Firecrawl services (API and Playwright)"
  vpc_id      = local.vpc_id

  # Allow API service to access Firecrawl API
  ingress {
    description     = "Allow traffic from API service"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [local.security_group_ecs_id]
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
