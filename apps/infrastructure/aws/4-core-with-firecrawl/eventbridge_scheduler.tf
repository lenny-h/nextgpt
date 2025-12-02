# EventBridge Scheduler Schedule Group
resource "aws_scheduler_schedule_group" "tasks" {
  name = "${var.aws_project_name}-task-schedules"

  tags = {
    Name = "${var.aws_project_name}-task-schedules"
  }
}

# Custom Event Bus for document processing tasks
resource "aws_cloudwatch_event_bus" "document_processing" {
  name = "${var.aws_project_name}-document-processing"

  tags = {
    Name = "${var.aws_project_name}-document-processing-bus"
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

# IAM Role for API Destinations (used by EventBridge Rules)
resource "aws_iam_role" "eventbridge_api_destination" {
  name = "${var.aws_project_name}-eventbridge-api-dest-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "events.amazonaws.com"
      }
    }]
  })

  tags = {
    Name = "${var.aws_project_name}-eventbridge-api-dest-role"
  }
}

# Policy for API Destination invocation
resource "aws_iam_role_policy" "eventbridge_api_destination" {
  name = "${var.aws_project_name}-eventbridge-api-dest-policy"
  role = aws_iam_role.eventbridge_api_destination.id

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

# EventBridge Rule for PDF Processing - routes events to API Destination
resource "aws_cloudwatch_event_rule" "process_pdf" {
  name           = "${var.aws_project_name}-process-pdf-rule"
  description    = "Routes PDF processing events to API Destination"
  event_bus_name = aws_cloudwatch_event_bus.document_processing.name

  event_pattern = jsonencode({
    "detail-type" = ["process-pdf"]
  })

  tags = {
    Name = "${var.aws_project_name}-process-pdf-rule"
  }
}

# EventBridge Target for PDF Processing
resource "aws_cloudwatch_event_target" "process_pdf" {
  rule           = aws_cloudwatch_event_rule.process_pdf.name
  event_bus_name = aws_cloudwatch_event_bus.document_processing.name
  target_id      = "process-pdf-api-destination"
  arn            = aws_cloudwatch_event_api_destination.process_pdf.arn
  role_arn       = aws_iam_role.eventbridge_api_destination.arn

  # Pass the event detail as the HTTP body
  input_path = "$.detail"

  http_target {
    header_parameters       = {}
    query_string_parameters = {}
  }

  retry_policy {
    maximum_event_age_in_seconds = 3600
    maximum_retry_attempts       = 3
  }
}

# EventBridge Rule for Document Processing - routes events to API Destination
resource "aws_cloudwatch_event_rule" "process_document" {
  name           = "${var.aws_project_name}-process-document-rule"
  description    = "Routes document processing events to API Destination"
  event_bus_name = aws_cloudwatch_event_bus.document_processing.name

  event_pattern = jsonencode({
    "detail-type" = ["process-document"]
  })

  tags = {
    Name = "${var.aws_project_name}-process-document-rule"
  }
}

# EventBridge Target for Document Processing
resource "aws_cloudwatch_event_target" "process_document" {
  rule           = aws_cloudwatch_event_rule.process_document.name
  event_bus_name = aws_cloudwatch_event_bus.document_processing.name
  target_id      = "process-document-api-destination"
  arn            = aws_cloudwatch_event_api_destination.process_document.arn
  role_arn       = aws_iam_role.eventbridge_api_destination.arn

  # Pass the event detail as the HTTP body
  input_path = "$.detail"

  http_target {
    header_parameters       = {}
    query_string_parameters = {}
  }

  retry_policy {
    maximum_event_age_in_seconds = 3600
    maximum_retry_attempts       = 3
  }
}

# IAM Role for EventBridge Scheduler (to put events to event bus)
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

# EventBridge Scheduler Policy to put events to the custom event bus
resource "aws_iam_role_policy" "eventbridge_scheduler" {
  name = "${var.aws_project_name}-eventbridge-scheduler-policy"
  role = aws_iam_role.eventbridge_scheduler.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "events:PutEvents"
        ]
        Resource = [
          aws_cloudwatch_event_bus.document_processing.arn
        ]
      }
    ]
  })
}
