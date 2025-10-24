# Get current Azure client for Key Vault access policies
data "azurerm_client_config" "current" {}

# Azure Key Vault for storing secrets
resource "azurerm_key_vault" "main" {
  name                       = "${replace(var.resource_group_name, "-", "")}kv"
  location                   = azurerm_resource_group.main.location
  resource_group_name        = azurerm_resource_group.main.name
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  sku_name                   = "standard"
  soft_delete_retention_days = 7
  purge_protection_enabled   = false

  network_acls {
    default_action = "Allow"
    bypass         = "AzureServices"
  }
}

# Database password
resource "azurerm_key_vault_secret" "db_password" {
  name         = "db-password"
  value        = var.db_password
  key_vault_id = azurerm_key_vault.main.id

  depends_on = [
    azurerm_role_assignment.terraform_key_vault_admin
  ]
}

# Better Auth secret
resource "azurerm_key_vault_secret" "better_auth_secret" {
  name         = "better-auth-secret"
  value        = var.better_auth_secret
  key_vault_id = azurerm_key_vault.main.id

  depends_on = [
    azurerm_role_assignment.terraform_key_vault_admin
  ]
}

# Resend API key
resource "azurerm_key_vault_secret" "resend_api_key" {
  name         = "resend-api-key"
  value        = var.resend_api_key
  key_vault_id = azurerm_key_vault.main.id

  depends_on = [
    azurerm_role_assignment.terraform_key_vault_admin
  ]
}

# Cloudflare R2 access key ID
resource "azurerm_key_vault_secret" "cloudflare_r2_access_key_id" {
  name         = "r2-access-key-id"
  value        = var.cloudflare_r2_access_key_id
  key_vault_id = azurerm_key_vault.main.id

  depends_on = [
    azurerm_role_assignment.terraform_key_vault_admin
  ]
}

# Cloudflare R2 secret access key
resource "azurerm_key_vault_secret" "cloudflare_r2_secret_access_key" {
  name         = "r2-secret-access-key"
  value        = var.cloudflare_r2_secret_access_key
  key_vault_id = azurerm_key_vault.main.id

  depends_on = [
    azurerm_role_assignment.terraform_key_vault_admin
  ]
}

# Encryption key for sensitive data
resource "azurerm_key_vault_secret" "encryption_key" {
  name         = "encryption-key"
  value        = var.encryption_key
  key_vault_id = azurerm_key_vault.main.id

  depends_on = [
    azurerm_role_assignment.terraform_key_vault_admin
  ]
}

# ACR password (stored for reference, but we'll use managed identity)
resource "azurerm_key_vault_secret" "acr_password" {
  name         = "acr-password"
  value        = azurerm_container_registry.main.admin_password
  key_vault_id = azurerm_key_vault.main.id

  depends_on = [
    azurerm_role_assignment.terraform_key_vault_admin
  ]
}

# Redis password
resource "azurerm_key_vault_secret" "redis_password" {
  name         = "redis-password"
  value        = azurerm_redis_cache.main.primary_access_key
  key_vault_id = azurerm_key_vault.main.id

  depends_on = [
    azurerm_role_assignment.terraform_key_vault_admin
  ]
}

# Service Bus connection string
resource "azurerm_key_vault_secret" "service_bus_connection_string" {
  name         = "service-bus-connection-string"
  value        = azurerm_servicebus_namespace.main.default_primary_connection_string
  key_vault_id = azurerm_key_vault.main.id

  depends_on = [
    azurerm_role_assignment.terraform_key_vault_admin
  ]
}

# Grant Terraform service principal admin access to Key Vault
resource "azurerm_role_assignment" "terraform_key_vault_admin" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Administrator"
  principal_id         = data.azurerm_client_config.current.object_id
}
