output "resource_group_name" {
  description = "The name of the resource group"
  value       = azurerm_resource_group.main.name
}

output "container_registry_url" {
  description = "The URL of the container registry"
  value       = azurerm_container_registry.main.login_server
}

output "api_fqdn" {
  description = "The FQDN of the API container app"
  value       = azurerm_container_app.api.latest_revision_fqdn
}

output "document_processor_fqdn" {
  description = "The FQDN of the document processor container app"
  value       = azurerm_container_app.document_processor.latest_revision_fqdn
}

output "pdf_exporter_fqdn" {
  description = "The FQDN of the PDF exporter container app"
  value       = azurerm_container_app.pdf_exporter.latest_revision_fqdn
}

output "database_fqdn" {
  description = "The FQDN of the PostgreSQL server"
  value       = azurerm_postgresql_flexible_server.main.fqdn
}

output "redis_hostname" {
  description = "The hostname of the Redis cache"
  value       = azurerm_redis_cache.main.hostname
}

# GitHub Actions Service Principal Outputs
output "github_actions_credentials" {
  description = "GitHub Actions service principal credentials (JSON format for AZURE_CREDENTIALS secret)"
  value = jsonencode({
    clientId       = azuread_application.github_actions.client_id
    clientSecret   = azuread_service_principal_password.github_actions.value
    subscriptionId = data.azurerm_client_config.current.subscription_id
    tenantId       = data.azurerm_client_config.current.tenant_id
  })
  sensitive = true
}

