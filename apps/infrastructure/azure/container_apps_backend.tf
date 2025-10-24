# Azure Container Registry
resource "azurerm_container_registry" "main" {
  name                = replace("${var.resource_group_name}acr", "-", "")
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "Basic"
  admin_enabled       = false
}

# Container Apps Environment
resource "azurerm_container_app_environment" "main" {
  name                           = "${var.resource_group_name}-env"
  location                       = azurerm_resource_group.main.location
  resource_group_name            = azurerm_resource_group.main.name
  infrastructure_subnet_id       = azurerm_subnet.container_apps.id
  internal_load_balancer_enabled = false
}

# API Container App
resource "azurerm_container_app" "api" {
  name                         = "api"
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = azurerm_resource_group.main.name
  revision_mode                = "Single"

  identity {
    type = "SystemAssigned"
  }

  registry {
    server   = azurerm_container_registry.main.login_server
    identity = "system"
  }

  secret {
    name                = "db-password"
    key_vault_secret_id = azurerm_key_vault_secret.db_password.versionless_id
    identity            = "system"
  }

  secret {
    name                = "resend-api-key"
    key_vault_secret_id = azurerm_key_vault_secret.resend_api_key.versionless_id
    identity            = "system"
  }

  secret {
    name                = "better-auth-secret"
    key_vault_secret_id = azurerm_key_vault_secret.better_auth_secret.versionless_id
    identity            = "system"
  }

  secret {
    name                = "cloudflare-access-key-id"
    key_vault_secret_id = azurerm_key_vault_secret.cloudflare_r2_access_key_id.versionless_id
    identity            = "system"
  }

  secret {
    name                = "cloudflare-secret-access-key"
    key_vault_secret_id = azurerm_key_vault_secret.cloudflare_r2_secret_access_key.versionless_id
    identity            = "system"
  }

  secret {
    name                = "encryption-key"
    key_vault_secret_id = azurerm_key_vault_secret.encryption_key.versionless_id
    identity            = "system"
  }

  secret {
    name                = "redis-password"
    key_vault_secret_id = azurerm_key_vault_secret.redis_password.versionless_id
    identity            = "system"
  }

  secret {
    name                = "service-bus-connection-string"
    key_vault_secret_id = azurerm_key_vault_secret.service_bus_connection_string.versionless_id
    identity            = "system"
  }

  template {
    container {
      name   = "api"
      image  = "${azurerm_container_registry.main.login_server}/api:latest"
      cpu    = 0.5
      memory = "512Mi"

      env {
        name  = "BASE_URL"
        value = "https://app.${var.site_url}"
      }

      env {
        name  = "ALLOWED_ORIGINS"
        value = "https://app.${var.site_url},https://dashboard.${var.site_url}"
      }

      env {
        name  = "ALLOWED_EMAIL_DOMAINS"
        value = var.allowed_email_domains
      }

      env {
        name        = "RESEND_API_KEY"
        secret_name = "resend-api-key"
      }

      env {
        name  = "RESEND_SENDER_EMAIL"
        value = var.resend_sender_email
      }

      env {
        name  = "BETTER_AUTH_URL"
        value = "https://api.${var.site_url}"
      }

      env {
        name        = "BETTER_AUTH_SECRET"
        secret_name = "better-auth-secret"
      }

      env {
        name        = "DATABASE_PASSWORD"
        secret_name = "db-password"
      }

      env {
        name  = "DATABASE_HOST"
        value = azurerm_postgresql_flexible_server.main.fqdn
      }

      env {
        name        = "REDIS_PASSWORD"
        secret_name = "redis-password"
      }

      env {
        name  = "REDIS_URL"
        value = "rediss://:$(REDIS_PASSWORD)@${azurerm_redis_cache.main.hostname}:${azurerm_redis_cache.main.ssl_port}"
      }

      env {
        name  = "R2_ENDPOINT"
        value = "https://${var.cloudflare_account_id}.r2.cloudflarestorage.com"
      }

      env {
        name        = "CLOUDFLARE_ACCESS_KEY_ID"
        secret_name = "cloudflare-access-key-id"
      }

      env {
        name        = "CLOUDFLARE_SECRET_ACCESS_KEY"
        secret_name = "cloudflare-secret-access-key"
      }

      env {
        name  = "PROCESSOR_URL"
        value = "https://${azurerm_container_app.document_processor.latest_revision_fqdn}"
      }

      env {
        name  = "TASK_QUEUE_NAME"
        value = azurerm_servicebus_queue.document_processing.name
      }

      env {
        name        = "TASK_QUEUE_CONNECTION_STRING"
        secret_name = "service-bus-connection-string"
      }

      env {
        name        = "ENCRYPTION_KEY"
        secret_name = "encryption-key"
      }

      env {
        name  = "ATTACHMENT_URL_PREFIX"
        value = "https://${azurerm_storage_account.main.name}.blob.core.windows.net/${azurerm_storage_container.temporary_files.name}/"
      }

      env {
        name  = "EMBEDDINGS_MODEL"
        value = var.embeddings_model
      }

      env {
        name  = "LLM_MODELS"
        value = var.llm_models
      }
    }

    min_replicas = 0
    max_replicas = 5
  }

  ingress {
    external_enabled = true
    target_port      = 8080
    traffic_weight {
      latest_revision = true
      percentage      = 100
    }

    # IP Security Restrictions - Only allow Cloudflare IPs
    dynamic "ip_security_restriction" {
      for_each = local.all_cloudflare_ips
      content {
        name             = "cloudflare-${replace(ip_security_restriction.value, "/", "-")}"
        ip_address_range = ip_security_restriction.value
        action           = "Allow"
      }
    }
  }

  lifecycle {
    ignore_changes = [
      template[0].container[0].image,
    ]
  }
}

# Document Processor Container App
resource "azurerm_container_app" "document_processor" {
  name                         = "document-processor"
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = azurerm_resource_group.main.name
  revision_mode                = "Single"

  identity {
    type = "SystemAssigned"
  }

  registry {
    server   = azurerm_container_registry.main.login_server
    identity = "system"
  }

  secret {
    name                = "db-password"
    key_vault_secret_id = azurerm_key_vault_secret.db_password.versionless_id
    identity            = "system"
  }

  secret {
    name                = "cloudflare-access-key-id"
    key_vault_secret_id = azurerm_key_vault_secret.cloudflare_r2_access_key_id.versionless_id
    identity            = "system"
  }

  secret {
    name                = "cloudflare-secret-access-key"
    key_vault_secret_id = azurerm_key_vault_secret.cloudflare_r2_secret_access_key.versionless_id
    identity            = "system"
  }

  template {
    container {
      name   = "document-processor"
      image  = "${azurerm_container_registry.main.login_server}/document-processor:latest"
      cpu    = 2
      memory = "4Gi"

      env {
        name        = "DATABASE_PASSWORD"
        secret_name = "db-password"
      }

      env {
        name  = "DATABASE_HOST"
        value = azurerm_postgresql_flexible_server.main.fqdn
      }

      env {
        name  = "R2_ENDPOINT"
        value = "https://${var.cloudflare_account_id}.r2.cloudflarestorage.com"
      }

      env {
        name        = "CLOUDFLARE_ACCESS_KEY_ID"
        secret_name = "cloudflare-access-key-id"
      }

      env {
        name        = "CLOUDFLARE_SECRET_ACCESS_KEY"
        secret_name = "cloudflare-secret-access-key"
      }

      env {
        name  = "EMBEDDINGS_MODEL"
        value = var.embeddings_model
      }
    }

    min_replicas = 0
    max_replicas = 5
  }

  ingress {
    external_enabled = false
    target_port      = 8080
    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }

  lifecycle {
    ignore_changes = [
      template[0].container[0].image,
    ]
  }
}

# PDF Exporter Container App
resource "azurerm_container_app" "pdf_exporter" {
  name                         = "pdf-exporter"
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = azurerm_resource_group.main.name
  revision_mode                = "Single"

  identity {
    type = "SystemAssigned"
  }

  registry {
    server   = azurerm_container_registry.main.login_server
    identity = "system"
  }

  template {
    container {
      name   = "pdf-exporter"
      image  = "${azurerm_container_registry.main.login_server}/pdf-exporter:latest"
      cpu    = 0.5
      memory = "512Mi"

      env {
        name  = "ALLOWED_ORIGINS"
        value = "https://app.${var.site_url},https://dashboard.${var.site_url}"
      }
    }

    min_replicas = 0
    max_replicas = 5
  }

  ingress {
    external_enabled = true
    target_port      = 8080
    traffic_weight {
      latest_revision = true
      percentage      = 100
    }

    # IP Security Restrictions - Only allow Cloudflare IPs
    dynamic "ip_security_restriction" {
      for_each = local.all_cloudflare_ips
      content {
        name             = "cloudflare-${replace(ip_security_restriction.value, "/", "-")}"
        ip_address_range = ip_security_restriction.value
        action           = "Allow"
      }
    }
  }

  lifecycle {
    ignore_changes = [
      template[0].container[0].image,
    ]
  }
}
