# Storage Account
resource "azurerm_storage_account" "main" {
  name                     = replace("${var.resource_group_name}storage", "-", "")
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  min_tls_version          = "TLS1_2"

  blob_properties {
    cors_rule {
      allowed_headers    = ["*"]
      allowed_methods    = ["GET", "POST", "DELETE", "PUT", "HEAD"]
      allowed_origins    = ["http://localhost:3000", "http://localhost:3001", "https://app.${var.site_url}", "https://dashboard.${var.site_url}"]
      exposed_headers    = ["*"]
      max_age_in_seconds = 3600
    }
  }
}

# Container for temporary files with automatic cleanup
resource "azurerm_storage_container" "temporary_files" {
  name                  = "temporary-files"
  storage_account_id    = azurerm_storage_account.main.id
  container_access_type = "private"
}

# Lifecycle management policy for automatic deletion
resource "azurerm_storage_management_policy" "temporary_files_cleanup" {
  storage_account_id = azurerm_storage_account.main.id

  rule {
    name    = "delete-after-1-day"
    enabled = true

    filters {
      blob_types   = ["blockBlob"]
      prefix_match = ["temporary-files/"]
    }

    actions {
      base_blob {
        delete_after_days_since_modification_greater_than = 1
      }
    }
  }
}

# Grant API Container App access to storage
resource "azurerm_role_assignment" "api_storage_blob_contributor" {
  scope                = azurerm_storage_account.main.id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = azurerm_container_app.api.identity[0].principal_id
}

# # Uncomment if not using cloudflare r2 for file storage
# # Container for permanent files
# resource "azurerm_storage_container" "files" {
#   name                  = "files"
#   storage_account_id    = azurerm_storage_account.main.id
#   container_access_type = "private"
# }
