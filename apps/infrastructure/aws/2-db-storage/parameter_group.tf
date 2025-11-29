# DB Parameter Group
resource "aws_db_parameter_group" "postgres" {
  name   = "${var.aws_project_name}-postgres-params"
  family = "postgres18"

  parameter {
    name         = "shared_preload_libraries"
    value        = "pg_cron"
    apply_method = "pending-reboot"
  }

  parameter {
    name  = "cron.database_name"
    value = "postgres"
  }
}
