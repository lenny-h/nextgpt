# IAM Configuration for Azure Container Apps

# ===================================
# API Container App IAM
# ===================================

# Grant API access to Key Vault secrets
resource "azurerm_role_assignment" "api_key_vault_secrets_user" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_container_app.api.identity[0].principal_id
}

# Grant API access to read from temporary files storage
resource "azurerm_role_assignment" "api_storage_blob_reader" {
  scope                = azurerm_storage_account.main.id
  role_definition_name = "Storage Blob Data Reader"
  principal_id         = azurerm_container_app.api.identity[0].principal_id
}

# Grant API access to write to temporary files storage
resource "azurerm_role_assignment" "api_storage_blob_contributor" {
  scope                = azurerm_storage_container.temporary_files.resource_manager_id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = azurerm_container_app.api.identity[0].principal_id
}

# # Uncomment if not using cloudflare r2 for file storage
# # Grant API access to permanent files storage
# resource "azurerm_role_assignment" "api_files_blob_contributor" {
#   scope                = azurerm_storage_container.files.resource_manager_id
#   role_definition_name = "Storage Blob Data Contributor"
#   principal_id         = azurerm_container_app.api.identity[0].principal_id
# }

# Grant API access to send messages to Service Bus
resource "azurerm_role_assignment" "api_service_bus_sender" {
  scope                = azurerm_servicebus_namespace.main.id
  role_definition_name = "Azure Service Bus Data Sender"
  principal_id         = azurerm_container_app.api.identity[0].principal_id
}

# Grant API access to pull images from Container Registry
resource "azurerm_role_assignment" "api_acr_pull" {
  scope                = azurerm_container_registry.main.id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_container_app.api.identity[0].principal_id
}

# ===================================
# Document Processor Container App IAM
# ===================================

# Grant Document Processor access to Key Vault secrets
resource "azurerm_role_assignment" "document_processor_key_vault_secrets_user" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_container_app.document_processor.identity[0].principal_id
}

# Grant Document Processor access to receive messages from Service Bus
resource "azurerm_role_assignment" "document_processor_service_bus_receiver" {
  scope                = azurerm_servicebus_namespace.main.id
  role_definition_name = "Azure Service Bus Data Receiver"
  principal_id         = azurerm_container_app.document_processor.identity[0].principal_id
}

# # Uncomment if not using cloudflare r2 for file storage
# # Grant Document Processor access to permanent files storage
# resource "azurerm_role_assignment" "document_processor_files_blob_contributor" {
#   scope                = azurerm_storage_container.files.resource_manager_id
#   role_definition_name = "Storage Blob Data Contributor"
#   principal_id         = azurerm_container_app.document_processor.identity[0].principal_id
# }

# Grant Document Processor access to pull images from Container Registry
resource "azurerm_role_assignment" "document_processor_acr_pull" {
  scope                = azurerm_container_registry.main.id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_container_app.document_processor.identity[0].principal_id
}

# ===================================
# PDF Exporter Container App IAM
# ===================================

# Grant PDF Exporter access to pull images from Container Registry
resource "azurerm_role_assignment" "pdf_exporter_acr_pull" {
  scope                = azurerm_container_registry.main.id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_container_app.pdf_exporter.identity[0].principal_id
}

# ===================================
# GitHub Actions Service Principal with Secret
# ===================================

# Create an Azure AD application for GitHub Actions
resource "azuread_application" "github_actions" {
  display_name = "github-actions-${var.resource_group_name}"
}

# Create a service principal for the application
resource "azuread_service_principal" "github_actions" {
  client_id = azuread_application.github_actions.client_id
}

# Create a client secret (password) for the service principal
resource "azuread_service_principal_password" "github_actions" {
  service_principal_id = azuread_service_principal.github_actions.id
  display_name         = "GitHub Actions Secret"
}

# Grant GitHub Actions service principal permission to push to Container Registry
resource "azurerm_role_assignment" "github_actions_acr_push" {
  scope                = azurerm_container_registry.main.id
  role_definition_name = "AcrPush"
  principal_id         = azuread_service_principal.github_actions.object_id
}

# Grant GitHub Actions service principal permission to manage Container Apps
resource "azurerm_role_assignment" "github_actions_contributor" {
  scope                = azurerm_resource_group.main.id
  role_definition_name = "Contributor"
  principal_id         = azuread_service_principal.github_actions.object_id
}
