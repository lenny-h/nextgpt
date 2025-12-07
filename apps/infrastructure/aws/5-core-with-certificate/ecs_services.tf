# API ECS Service
resource "aws_ecs_service" "api" {
  name            = "api"
  cluster         = data.terraform_remote_state.db_storage.outputs.ecs_cluster_id
  task_definition = data.terraform_remote_state.core.outputs.ecs_task_definition_api_arn
  desired_count   = 0
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = data.terraform_remote_state.db_storage.outputs.private_subnet_ids
    security_groups  = [data.terraform_remote_state.db_storage.outputs.security_group_ecs_tasks_id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = data.terraform_remote_state.core.outputs.target_group_api_arn
    container_name   = "api"
    container_port   = 8080
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  depends_on = [aws_lb_listener.https]

  tags = {
    Name = "${var.aws_project_name}-api-service"
  }
}

# PDF Exporter ECS Service
resource "aws_ecs_service" "pdf_exporter" {
  name            = "pdf-exporter"
  cluster         = data.terraform_remote_state.db_storage.outputs.ecs_cluster_id
  task_definition = data.terraform_remote_state.core.outputs.ecs_task_definition_pdf_exporter_arn
  desired_count   = 0
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = data.terraform_remote_state.db_storage.outputs.private_subnet_ids
    security_groups  = [data.terraform_remote_state.db_storage.outputs.security_group_ecs_tasks_id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = data.terraform_remote_state.core.outputs.target_group_pdf_exporter_arn
    container_name   = "pdf-exporter"
    container_port   = 8080
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  depends_on = [aws_lb_listener.https]

  tags = {
    Name = "${var.aws_project_name}-pdf-exporter-service"
  }
}

# Autoscaling for API Service
resource "aws_appautoscaling_target" "api" {
  max_capacity       = 5
  min_capacity       = 1
  resource_id        = "service/${data.terraform_remote_state.db_storage.outputs.ecs_cluster_name}/${aws_ecs_service.api.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "api_cpu" {
  name               = "${var.aws_project_name}-api-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.api.resource_id
  scalable_dimension = aws_appautoscaling_target.api.scalable_dimension
  service_namespace  = aws_appautoscaling_target.api.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 85.0
    scale_in_cooldown  = 200
    scale_out_cooldown = 90
  }
}

resource "aws_appautoscaling_policy" "api_memory" {
  name               = "${var.aws_project_name}-api-memory-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.api.resource_id
  scalable_dimension = aws_appautoscaling_target.api.scalable_dimension
  service_namespace  = aws_appautoscaling_target.api.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value       = 85.0
    scale_in_cooldown  = 200
    scale_out_cooldown = 90
  }
}

# Autoscaling for PDF Exporter Service
resource "aws_appautoscaling_target" "pdf_exporter" {
  max_capacity       = 5
  min_capacity       = 1
  resource_id        = "service/${data.terraform_remote_state.db_storage.outputs.ecs_cluster_name}/${aws_ecs_service.pdf_exporter.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "pdf_exporter_cpu" {
  name               = "${var.aws_project_name}-pdf-exporter-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.pdf_exporter.resource_id
  scalable_dimension = aws_appautoscaling_target.pdf_exporter.scalable_dimension
  service_namespace  = aws_appautoscaling_target.pdf_exporter.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 85.0
    scale_in_cooldown  = 200
    scale_out_cooldown = 90
  }
}

resource "aws_appautoscaling_policy" "pdf_exporter_memory" {
  name               = "${var.aws_project_name}-pdf-exporter-memory-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.pdf_exporter.resource_id
  scalable_dimension = aws_appautoscaling_target.pdf_exporter.scalable_dimension
  service_namespace  = aws_appautoscaling_target.pdf_exporter.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value       = 85.0
    scale_in_cooldown  = 200
    scale_out_cooldown = 90
  }
}
