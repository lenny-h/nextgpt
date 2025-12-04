# API ECS Service
resource "aws_ecs_service" "api" {
  name            = "api"
  cluster         = data.terraform_remote_state.db_storage.outputs.ecs_cluster_id
  task_definition = data.terraform_remote_state.core.outputs.ecs_task_definition_api_arn
  desired_count   = 1
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
  desired_count   = 1
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
