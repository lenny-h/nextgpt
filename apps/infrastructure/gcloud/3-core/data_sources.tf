# Import outputs from 2-db-storage step using terraform remote state
data "terraform_remote_state" "db_storage" {
  backend = "local"

  config = {
    path = "../2-db-storage/terraform.tfstate"
  }
}

# Import outputs from 1-repository step using terraform remote state
data "terraform_remote_state" "repository" {
  backend = "local"

  config = {
    path = "../1-repository/terraform.tfstate"
  }
}

# Local values to simplify references in other files
locals {
  # From 2-db-storage
  vpc_network_id        = data.terraform_remote_state.db_storage.outputs.vpc_network_id
  vpc_network_name      = data.terraform_remote_state.db_storage.outputs.vpc_network_name
  postgres_private_ip   = data.terraform_remote_state.db_storage.outputs.postgres_private_ip
  postgres_connection   = data.terraform_remote_state.db_storage.outputs.postgres_connection_name
  redis_host            = data.terraform_remote_state.db_storage.outputs.redis_host
  redis_port            = data.terraform_remote_state.db_storage.outputs.redis_port
  db_password_secret_id = data.terraform_remote_state.db_storage.outputs.db_password_secret_id
  db_migrator_job_name  = data.terraform_remote_state.db_storage.outputs.db_migrator_job_name

  # From 1-repository
  artifact_registry_url = data.terraform_remote_state.repository.outputs.artifact_registry_url
}
