# ACM Certificate Validation
resource "aws_acm_certificate_validation" "main" {
  certificate_arn         = data.terraform_remote_state.core.outputs.acm_certificate_arn
  validation_record_fqdns = [for record in data.terraform_remote_state.core.outputs.dns_validation_records : record.name]
}

# Target Group for Document Processor (for EventBridge access via ALB)
resource "aws_lb_target_group" "document_processor" {
  name        = "${var.aws_project_name}-doc-proc-tg"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = data.terraform_remote_state.db_storage.outputs.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 150
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 3
  }

  deregistration_delay = 30

  tags = {
    Name = "${var.aws_project_name}-doc-proc-tg"
  }
}

# HTTPS Listener
resource "aws_lb_listener" "https" {
  load_balancer_arn = data.terraform_remote_state.core.outputs.load_balancer_arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = data.terraform_remote_state.core.outputs.acm_certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = data.terraform_remote_state.core.outputs.target_group_api_arn
  }

  depends_on = [aws_acm_certificate_validation.main]

  tags = {
    Name = "${var.aws_project_name}-https-listener"
  }
}

# Listener Rule for /pdf-exporter/*
resource "aws_lb_listener_rule" "pdf_exporter" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = data.terraform_remote_state.core.outputs.target_group_pdf_exporter_arn
  }

  condition {
    path_pattern {
      values = ["/pdf-exporter/*"]
    }
  }

  tags = {
    Name = "${var.aws_project_name}-pdf-exporter-rule"
  }
}

# Data source to get the encryption key from Secrets Manager (used for internal API auth)
data "aws_secretsmanager_secret_version" "encryption_key" {
  secret_id = data.terraform_remote_state.core.outputs.encryption_key_secret_arn
}

# Listener Rule for /internal/process-pdf (EventBridge only - requires API key)
resource "aws_lb_listener_rule" "document_processor_pdf" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 50

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.document_processor.arn
  }

  condition {
    path_pattern {
      values = ["/internal/process-pdf"]
    }
  }

  condition {
    http_header {
      http_header_name = "X-Internal-Api-Key"
      values           = [data.aws_secretsmanager_secret_version.encryption_key.secret_string]
    }
  }

  tags = {
    Name = "${var.aws_project_name}-doc-proc-pdf-rule"
  }
}

# Listener Rule for /internal/process-document (EventBridge only - requires API key)
resource "aws_lb_listener_rule" "document_processor_document" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 51

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.document_processor.arn
  }

  condition {
    path_pattern {
      values = ["/internal/process-document"]
    }
  }

  condition {
    http_header {
      http_header_name = "X-Internal-Api-Key"
      values           = [data.aws_secretsmanager_secret_version.encryption_key.secret_string]
    }
  }

  tags = {
    Name = "${var.aws_project_name}-doc-proc-document-rule"
  }
}
