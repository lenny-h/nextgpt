# ACM Certificate Validation
resource "aws_acm_certificate_validation" "main" {
  certificate_arn         = data.terraform_remote_state.core.outputs.acm_certificate_arn
  validation_record_fqdns = [for record in data.terraform_remote_state.core.outputs.dns_validation_records : record.name]
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
