# EventBridge Scheduler Schedule Group
resource "aws_scheduler_schedule_group" "tasks" {
  name = "${var.aws_project_name}-task-schedules"

  tags = {
    Name = "${var.aws_project_name}-task-schedules"
  }
}

# EventBridge Connection for Document Processor via ALB
resource "aws_cloudwatch_event_connection" "document_processor" {
  name               = "${var.aws_project_name}-document-processor-connection"
  description        = "Connection to document processor service via ALB"
  authorization_type = "API_KEY"

  auth_parameters {
    api_key {
      key   = "X-Internal-Api-Key"
      value = var.encryption_key
    }
  }
}

# API Destination for PDF Processing (via ALB HTTPS)
resource "aws_cloudwatch_event_api_destination" "process_pdf" {
  name                             = "${var.aws_project_name}-process-pdf"
  description                      = "API destination for PDF processing via ALB"
  invocation_endpoint              = "https://api.${var.site_url}/internal/process-pdf"
  http_method                      = "POST"
  invocation_rate_limit_per_second = 10
  connection_arn                   = aws_cloudwatch_event_connection.document_processor.arn
}

# API Destination for Document Processing (via ALB HTTPS)
resource "aws_cloudwatch_event_api_destination" "process_document" {
  name                             = "${var.aws_project_name}-process-document"
  description                      = "API destination for document processing via ALB"
  invocation_endpoint              = "https://api.${var.site_url}/internal/process-document"
  http_method                      = "POST"
  invocation_rate_limit_per_second = 10
  connection_arn                   = aws_cloudwatch_event_connection.document_processor.arn
}

# IAM Role for EventBridge Scheduler
resource "aws_iam_role" "eventbridge_scheduler" {
  name = "${var.aws_project_name}-eventbridge-scheduler-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "scheduler.amazonaws.com"
      }
    }]
  })

  tags = {
    Name = "${var.aws_project_name}-eventbridge-scheduler-role"
  }
}

# EventBridge Scheduler Policy to invoke API Destinations
resource "aws_iam_role_policy" "eventbridge_scheduler" {
  name = "${var.aws_project_name}-eventbridge-scheduler-policy"
  role = aws_iam_role.eventbridge_scheduler.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "events:InvokeApiDestination"
        ]
        Resource = [
          aws_cloudwatch_event_api_destination.process_pdf.arn,
          aws_cloudwatch_event_api_destination.process_document.arn
        ]
      }
    ]
  })
}
