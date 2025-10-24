# Azure Cache for Redis (Premium tier with VNet integration for security)
resource "azurerm_redis_cache" "main" {
  name                          = "${var.resource_group_name}-redis"
  location                      = azurerm_resource_group.main.location
  resource_group_name           = azurerm_resource_group.main.name
  capacity                      = 1
  family                        = "P"
  sku_name                      = "Premium"
  minimum_tls_version           = "1.2"
  public_network_access_enabled = false
  subnet_id                     = azurerm_subnet.redis.id

  redis_configuration {
  }

  depends_on = [azurerm_subnet.redis]
}
