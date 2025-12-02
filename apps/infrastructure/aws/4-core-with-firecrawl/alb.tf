# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.aws_project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = data.terraform_remote_state.db_storage.outputs.public_subnet_ids

  enable_deletion_protection = false
  enable_http2               = true

  tags = {
    Name = "${var.aws_project_name}-alb"
  }
}

# Target Group for API
resource "aws_lb_target_group" "api" {
  name        = "${var.aws_project_name}-api-tg"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = data.terraform_remote_state.db_storage.outputs.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 150
    matcher             = "200"
    path                = "/api/public/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 3
  }

  deregistration_delay = 30

  tags = {
    Name = "${var.aws_project_name}-api-tg"
  }
}

# Target Group for PDF Exporter
resource "aws_lb_target_group" "pdf_exporter" {
  name        = "${var.aws_project_name}-pdf-exp-tg"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = data.terraform_remote_state.db_storage.outputs.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 150
    matcher             = "200"
    path                = "/pdf-exporter/public/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 3
  }

  deregistration_delay = 30

  tags = {
    Name = "${var.aws_project_name}-pdf-exp-tg"
  }
}

# ACM Certificate for HTTPS
resource "aws_acm_certificate" "main" {
  domain_name       = "api.${var.site_url}"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "${var.aws_project_name}-cert"
  }
}

# HTTP Listener (redirect to HTTPS)
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }

  tags = {
    Name = "${var.aws_project_name}-http-listener"
  }
}
