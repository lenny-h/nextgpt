# EventBridge Scheduler Schedule Group
resource "aws_scheduler_schedule_group" "tasks" {
  name = "${var.project_name}-task-schedules"

  tags = {
    Name = "${var.project_name}-task-schedules"
  }
}

# IAM Role for EventBridge Scheduler
resource "aws_iam_role" "eventbridge_scheduler" {
  name = "${var.project_name}-eventbridge-scheduler-role"

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
    Name = "${var.project_name}-eventbridge-scheduler-role"
  }
}

# EventBridge Scheduler Policy to send messages to SQS
resource "aws_iam_role_policy" "eventbridge_scheduler" {
  name = "${var.project_name}-eventbridge-scheduler-policy"
  role = aws_iam_role.eventbridge_scheduler.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = aws_sqs_queue.document_processing.arn
      }
    ]
  })
}

