# Service Bus Namespace
resource "azurerm_servicebus_namespace" "main" {
  name                = "${var.resource_group_name}-servicebus"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "Basic"
}

# Service Bus Queue for document processing
resource "azurerm_servicebus_queue" "document_processing" {
  name         = "document-processing-queue"
  namespace_id = azurerm_servicebus_namespace.main.id

  max_delivery_count  = 1
  lock_duration       = "PT30S"
  default_message_ttl = "PT10M"
}

# Grant API Container App permission to send messages
resource "azurerm_role_assignment" "api_servicebus_sender" {
  scope                = azurerm_servicebus_namespace.main.id
  role_definition_name = "Azure Service Bus Data Sender"
  principal_id         = azurerm_container_app.api.identity[0].principal_id
}

# Grant Document Processor Container App permission to receive messages
resource "azurerm_role_assignment" "processor_servicebus_receiver" {
  scope                = azurerm_servicebus_namespace.main.id
  role_definition_name = "Azure Service Bus Data Receiver"
  principal_id         = azurerm_container_app.document_processor.identity[0].principal_id
}
