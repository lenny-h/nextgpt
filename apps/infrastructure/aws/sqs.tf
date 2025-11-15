# SQS Queue for document processing
resource "aws_sqs_queue" "document_processing" {
  name                       = "${var.aws_project_name}-document-processing-queue"
  delay_seconds              = 0
  max_message_size           = 262144
  message_retention_seconds  = 600
  receive_wait_time_seconds  = 0
  visibility_timeout_seconds = 30

  tags = {
    Name = "${var.aws_project_name}-document-processing-queue"
  }
}

# SQS Queue Policy
resource "aws_sqs_queue_policy" "document_processing" {
  queue_url = aws_sqs_queue.document_processing.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowECSTasksToSendMessages"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.api_task.arn
        }
        Action   = "sqs:SendMessage"
        Resource = aws_sqs_queue.document_processing.arn
      }
    ]
  })
}
