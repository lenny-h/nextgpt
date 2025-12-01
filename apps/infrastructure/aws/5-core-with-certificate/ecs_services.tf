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

# Document Processor ECS Service (with load balancer for EventBridge access)
resource "aws_ecs_service" "document_processor" {
  name            = "document-processor"
  cluster         = data.terraform_remote_state.db_storage.outputs.ecs_cluster_id
  task_definition = data.terraform_remote_state.core.outputs.ecs_task_definition_document_processor_arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = data.terraform_remote_state.db_storage.outputs.private_subnet_ids
    security_groups  = [data.terraform_remote_state.db_storage.outputs.security_group_ecs_tasks_id]
    assign_public_ip = false
  }

  service_registries {
    registry_arn = data.terraform_remote_state.core.outputs.service_discovery_document_processor_arn
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.document_processor.arn
    container_name   = "document-processor"
    container_port   = 8080
  }

  tags = {
    Name = "${var.aws_project_name}-document-processor-service"
  }
}
