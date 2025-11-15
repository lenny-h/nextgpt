# AWS Cloud Map namespace for service discovery
resource "aws_service_discovery_private_dns_namespace" "services" {
  name        = "${var.aws_project_name}.local"
  description = "Private namespace for internal services"
  vpc         = data.terraform_remote_state.db_storage.outputs.vpc_id

  tags = {
    Name = "${var.aws_project_name}-services-namespace"
  }
}

# Service discovery for Document Processor
resource "aws_service_discovery_service" "document_processor" {
  name = "document-processor"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.services.id

    dns_records {
      ttl  = 10
      type = "A"
    }

    routing_policy = "MULTIVALUE"
  }

  tags = {
    Name = "${var.aws_project_name}-document-processor-discovery"
  }
}
