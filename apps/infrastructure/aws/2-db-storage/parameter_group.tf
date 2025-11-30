# DB Parameter Group
resource "aws_db_parameter_group" "postgres" {
  name   = "${var.aws_project_name}-postgres-params"
  family = "postgres18"

  parameter {
    name         = "cron.database_name"
    value        = "postgres"
    apply_method = "pending-reboot"
  }

  parameter {
    name         = "shared_preload_libraries"
    value        = "pg_cron"
    apply_method = "pending-reboot"
  }

  # Disable SSL requirement since DB is in private VPC
  parameter {
    name         = "rds.force_ssl"
    value        = "0"
    apply_method = "pending-reboot"
  }
}
