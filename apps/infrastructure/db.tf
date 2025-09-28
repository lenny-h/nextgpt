# Enable Cloud SQL Admin API
resource "google_project_service" "sqladmin" {
  project = var.project_id
  service = "sqladmin.googleapis.com"
}

# Cloud SQL Instance
resource "google_sql_database_instance" "postgres" {
  name                = "postgres"
  project             = var.project_id
  region              = var.region
  database_version    = "POSTGRES_17"
  deletion_protection = false

  depends_on = [google_service_networking_connection.private_vpc_connection]

  settings {
    tier    = "db-f1-micro"
    edition = "ENTERPRISE"

    # Backup configuration
    backup_configuration {
      enabled                        = true
      start_time                     = "02:00"
      location                       = var.region
      point_in_time_recovery_enabled = true
      transaction_log_retention_days = 7
      backup_retention_settings {
        retained_backups = 7
        retention_unit   = "COUNT"
      }
    }

    # IP configuration - enable public and private IP
    ip_configuration {
      ipv4_enabled                                  = true
      private_network                               = google_compute_network.private_network.id
      enable_private_path_for_google_cloud_services = true
    }

    # Availability type
    availability_type = "ZONAL"

    # Disk configuration
    disk_autoresize       = true
    disk_autoresize_limit = 100
    disk_size             = 20
    disk_type             = "PD_SSD"

    # Maintenance window
    maintenance_window {
      day          = 7
      hour         = 3
      update_track = "stable"
    }

    # Database flags for PostgreSQL optimization
    database_flags {
      name  = "max_connections"
      value = "100"
    }

    # database_flags {
    #   name  = "maintenance_work_mem"
    #   value = "32768"
    # }

    database_flags {
      name  = "log_min_messages"
      value = "warning"
    }

    database_flags {
      name  = "cloudsql.enable_pg_hint_plan"
      value = "on"
    }
  }

  timeouts {
    create = "30m"
    update = "30m"
    delete = "25m"
  }
}

# Create postgres user
resource "google_sql_user" "postgres_user" {
  name     = "postgres"
  instance = google_sql_database_instance.postgres.name
  password = var.db_password
  project  = var.project_id
}

# Create supabase_admin user
resource "google_sql_user" "supabase_admin_user" {
  name     = "supabase_admin"
  instance = google_sql_database_instance.postgres.name
  password = var.supabase_admin_password
  project  = var.project_id
}

# Initial database setup (runs only once during Terraform apply)
resource "null_resource" "initial_database_setup" {
  depends_on = [
    google_sql_database_instance.postgres,
    google_sql_user.postgres_user,
    google_sql_user.supabase_admin_user
  ]

  triggers = {
    # Only run on initial setup - don't re-run for migration changes
    database_instance = google_sql_database_instance.postgres.connection_name
    jwt_secret        = var.jwt_secret
    jwt_exp           = var.jwt_exp
  }

  provisioner "local-exec" {
    command = <<-EOT
      chmod +x ${path.module}/scripts/setup_gcloud_database.sh
      ${path.module}/scripts/setup_gcloud_database.sh \
        "${google_sql_database_instance.postgres.connection_name}" \
        "postgres" \
        "${var.db_password}" \
        "${var.supabase_admin_password}" \
        "${var.jwt_secret}" \
        "${var.jwt_exp}" \
        > logs/setup_database.log 2>&1
    EOT

    working_dir = path.module
  }

  provisioner "local-exec" {
    when    = destroy
    command = "true"
  }
}
