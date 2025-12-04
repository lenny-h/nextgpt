# EventBridge Scheduler Schedule Group
resource "aws_scheduler_schedule_group" "tasks" {
  name = "${var.aws_project_name}-task-schedules"

  tags = {
    Name = "${var.aws_project_name}-task-schedules"
  }
}

# IAM Role for EventBridge Scheduler (to run ECS tasks)
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

# EventBridge Scheduler Policy to run ECS tasks
resource "aws_iam_role_policy" "eventbridge_scheduler" {
  name = "${var.aws_project_name}-eventbridge-scheduler-policy"
  role = aws_iam_role.eventbridge_scheduler.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecs:RunTask"
        ]
        Resource = [
          aws_ecs_task_definition.document_processor.arn,
          "${replace(aws_ecs_task_definition.document_processor.arn, "/:\\d+$/", ":*")}"
        ]
        Condition = {
          ArnLike = {
            "ecs:cluster" = data.terraform_remote_state.db_storage.outputs.ecs_cluster_arn
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "iam:PassRole"
        ]
        Resource = [
          data.terraform_remote_state.db_storage.outputs.ecs_task_execution_role_arn,
          aws_iam_role.document_processor_task.arn
        ]
      }
    ]
  })
}
