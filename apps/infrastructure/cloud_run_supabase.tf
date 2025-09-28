# Enable Cloud Run API
resource "google_project_service" "run_api" {
  service = "run.googleapis.com"
}


# Analytics Service
resource "google_cloud_run_v2_service" "analytics" {
  name     = "supabase-analytics"
  location = var.region
  project  = var.project_id
  ingress  = "INGRESS_TRAFFIC_INTERNAL_ONLY"

  template {
    vpc_access {
      network_interfaces {
        network    = google_compute_network.private_network.id
        subnetwork = google_compute_subnetwork.private_subnet.id
      }
      egress = "PRIVATE_RANGES_ONLY"
    }
    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/app-artifact-repository/analytics:latest"
      ports {
        container_port = 4000
      }
      env {
        name  = "DB_HOSTNAME"
        value = google_sql_database_instance.postgres.private_ip_address
      }
      env {
        name  = "DB_PASSWORD"
        value = var.db_password
      }
      env {
        name  = "LOGFLARE_PUBLIC_ACCESS_TOKEN"
        value = var.logflare_public_access_token
      }
      env {
        name  = "LOGFLARE_PRIVATE_ACCESS_TOKEN"
        value = var.logflare_private_access_token
      }
      env {
        name  = "POSTGRES_BACKEND_URL"
        value = "postgresql://supabase_admin:${var.db_password}@${google_sql_database_instance.postgres.private_ip_address}:5432/_supabase"
      }
      env {
        name  = "DB_USERNAME"
        value = "supabase_admin"
      }
      env {
        name  = "DB_DATABASE"
        value = "_supabase"
      }
      env {
        name  = "DB_PORT"
        value = "5432"
      }
      env {
        name  = "DB_SCHEMA"
        value = "_analytics"
      }
      env {
        name  = "LOGFLARE_NODE_HOST"
        value = "0.0.0.0"
      }
      env {
        name  = "LOGFLARE_SINGLE_TENANT"
        value = "true"
      }
      env {
        name  = "LOGFLARE_SUPABASE_MODE"
        value = "true"
      }
      env {
        name  = "LOGFLARE_MIN_CLUSTER_SIZE"
        value = "1"
      }
      env {
        name  = "POSTGRES_BACKEND_SCHEMA"
        value = "_analytics"
      }
      env {
        name  = "LOGFLARE_FEATURE_FLAG_OVERRIDE"
        value = "multibackend=true"
      }
    }

    scaling {
      min_instance_count = 0
      max_instance_count = 5
    }
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
    ]
  }

  depends_on          = [google_project_service.run_api, null_resource.initial_database_setup]
  deletion_protection = false
}

# Auth Service
resource "google_cloud_run_v2_service" "auth" {
  name     = "supabase-auth"
  location = var.region
  project  = var.project_id
  ingress  = "INGRESS_TRAFFIC_INTERNAL_ONLY"

  template {
    vpc_access {
      network_interfaces {
        network    = google_compute_network.private_network.id
        subnetwork = google_compute_subnetwork.private_subnet.id
      }
      egress = "PRIVATE_RANGES_ONLY"
    }
    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/app-artifact-repository/auth:latest"
      ports {
        container_port = 9999
      }
      env {
        name  = "API_EXTERNAL_URL"
        value = "http://supabase-kong.${var.region}.internal"
      }
      env {
        name  = "GOTRUE_DB_DATABASE_URL"
        value = "postgres://supabase_auth_admin:${var.supabase_admin_password}@${google_sql_database_instance.postgres.private_ip_address}:5432/postgres"
      }
      env {
        name  = "GOTRUE_SITE_URL"
        value = "https://app.${var.site_url}"
      }
      env {
        name  = "GOTRUE_URI_ALLOW_LIST"
        value = "https://dashboard.${var.site_url}"
      }
      env {
        name  = "GOTRUE_DISABLE_SIGNUP"
        value = var.disable_signup
      }
      env {
        name  = "GOTRUE_JWT_EXP"
        value = var.jwt_exp
      }
      env {
        name  = "GOTRUE_JWT_SECRET"
        value = var.jwt_secret
      }
      env {
        name  = "GOTRUE_EXTERNAL_EMAIL_ENABLED"
        value = var.enable_email_signup
      }
      env {
        name  = "GOTRUE_EXTERNAL_ANONYMOUS_USERS_ENABLED"
        value = var.enable_anonymous_users
      }
      env {
        name  = "GOTRUE_MAILER_AUTOCONFIRM"
        value = var.enable_email_autoconfirm
      }
      env {
        name  = "GOTRUE_SMTP_ADMIN_EMAIL"
        value = var.smtp_admin_email
      }
      env {
        name  = "GOTRUE_SMTP_HOST"
        value = var.smtp_host
      }
      env {
        name  = "GOTRUE_SMTP_PORT"
        value = var.smtp_port
      }
      env {
        name  = "GOTRUE_SMTP_USER"
        value = var.smtp_user
      }
      env {
        name  = "GOTRUE_SMTP_PASS"
        value = var.smtp_pass
      }
      env {
        name  = "GOTRUE_SMTP_SENDER_NAME"
        value = var.smtp_sender_name
      }
      env {
        name  = "GOTRUE_MAILER_URLPATHS_INVITE"
        value = var.mailer_urlpaths_invite
      }
      env {
        name  = "GOTRUE_MAILER_URLPATHS_CONFIRMATION"
        value = var.mailer_urlpaths_confirmation
      }
      env {
        name  = "GOTRUE_MAILER_URLPATHS_RECOVERY"
        value = var.mailer_urlpaths_recovery
      }
      env {
        name  = "GOTRUE_MAILER_URLPATHS_EMAIL_CHANGE"
        value = var.mailer_urlpaths_email_change
      }
      env {
        name  = "GOTRUE_EXTERNAL_PHONE_ENABLED"
        value = var.enable_phone_signup
      }
      env {
        name  = "GOTRUE_SMS_AUTOCONFIRM"
        value = var.enable_phone_autoconfirm
      }
      env {
        name  = "GOTRUE_API_HOST"
        value = "0.0.0.0"
      }
      env {
        name  = "GOTRUE_API_PORT"
        value = "9999"
      }
      env {
        name  = "GOTRUE_DB_DRIVER"
        value = "postgres"
      }
      env {
        name  = "GOTRUE_JWT_ADMIN_ROLES"
        value = "service_role"
      }
      env {
        name  = "GOTRUE_JWT_AUD"
        value = "authenticated"
      }
      env {
        name  = "GOTRUE_JWT_DEFAULT_GROUP_NAME"
        value = "authenticated"
      }
    }

    scaling {
      min_instance_count = 0
      max_instance_count = 5
    }
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
    ]
  }

  depends_on          = [google_project_service.run_api, null_resource.initial_database_setup]
  deletion_protection = false
}

# Kong Service
resource "google_cloud_run_v2_service" "kong" {
  name     = "supabase-kong"
  location = var.region
  project  = var.project_id
  ingress  = "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER"

  template {
    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/app-artifact-repository/kong:latest"
      ports {
        container_port = 8000
      }
      # Set Kong environment variables
      env {
        name  = "KONG_DATABASE"
        value = "off"
      }
      env {
        name  = "KONG_DECLARATIVE_CONFIG"
        value = "/home/kong/kong.yml"
      }
      env {
        name  = "KONG_DNS_ORDER"
        value = "LAST,A,CNAME"
      }
      env {
        name  = "KONG_PLUGINS"
        value = "request-transformer,cors,key-auth,acl,basic-auth"
      }
      env {
        name  = "KONG_NGINX_PROXY_PROXY_BUFFER_SIZE"
        value = "160k"
      }
      env {
        name  = "KONG_NGINX_PROXY_PROXY_BUFFERS"
        value = "64 160k"
      }
      env {
        name  = "AUTH_HOST"
        value = "supabase-auth.${var.region}.internal"
      }
      env {
        name  = "REST_HOST"
        value = "supabase-rest.${var.region}.internal"
      }
      env {
        name  = "META_HOST"
        value = "supabase-meta.${var.region}.internal"
      }
      env {
        name  = "STUDIO_HOST"
        value = "supabase-studio.${var.region}.internal"
      }
      env {
        name  = "ANALYTICS_HOST"
        value = "supabase-analytics.${var.region}.internal"
      }
      env {
        name  = "DASHBOARD_USERNAME"
        value = "supabase"
      }
      env {
        name  = "DASHBOARD_PASSWORD"
        value = var.studio_password
      }
    }

    scaling {
      min_instance_count = 0
      max_instance_count = 5
    }
  }

  traffic {
    percent = 100
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
    ]
  }

  depends_on          = [google_project_service.run_api, null_resource.initial_database_setup]
  deletion_protection = false
}

# Meta Service
resource "google_cloud_run_v2_service" "meta" {
  name     = "supabase-meta"
  location = var.region
  project  = var.project_id
  ingress  = "INGRESS_TRAFFIC_INTERNAL_ONLY"

  template {
    vpc_access {
      network_interfaces {
        network    = google_compute_network.private_network.id
        subnetwork = google_compute_subnetwork.private_subnet.id
      }
      egress = "PRIVATE_RANGES_ONLY"
    }
    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/app-artifact-repository/meta:latest"
      ports {
        container_port = 8080
      }
      env {
        name  = "PG_META_DB_PASSWORD"
        value = var.db_password
      }
      env {
        name  = "PG_META_DB_NAME"
        value = "postgres"
      }
      env {
        name  = "PG_META_DB_HOST"
        value = google_sql_database_instance.postgres.private_ip_address
      }
      env {
        name  = "PG_META_DB_PORT"
        value = "5432"
      }
      env {
        name  = "PG_META_PORT"
        value = "8080"
      }
      env {
        name  = "PG_META_DB_USER"
        value = "supabase_admin"
      }
    }

    scaling {
      min_instance_count = 0
      max_instance_count = 5
    }
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
    ]
  }

  depends_on          = [google_project_service.run_api, null_resource.initial_database_setup]
  deletion_protection = false
}

# REST Service
resource "google_cloud_run_v2_service" "rest" {
  name     = "supabase-rest"
  location = var.region
  project  = var.project_id
  ingress  = "INGRESS_TRAFFIC_INTERNAL_ONLY"

  template {
    vpc_access {
      network_interfaces {
        network    = google_compute_network.private_network.id
        subnetwork = google_compute_subnetwork.private_subnet.id
      }
      egress = "PRIVATE_RANGES_ONLY"
    }
    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/app-artifact-repository/rest:latest"
      ports {
        container_port = 3000
      }
      env {
        name  = "PGRST_DB_URI"
        value = "postgres://authenticator:${var.db_password}@${google_sql_database_instance.postgres.private_ip_address}:5432/postgres"
      }
      env {
        name  = "PGRST_JWT_SECRET"
        value = var.jwt_secret
      }
      env {
        name  = "PGRST_APP_SETTINGS_JWT_SECRET"
        value = var.jwt_secret
      }
      env {
        name  = "PGRST_APP_SETTINGS_JWT_EXP"
        value = var.jwt_exp
      }
      env {
        name  = "PGRST_DB_SCHEMA"
        value = "public"
      }
      env {
        name  = "PGRST_DB_ANON_ROLE"
        value = "anon"
      }
      env {
        name  = "PGRST_DB_USE_LEGACY_GUCS"
        value = "false"
      }
    }

    scaling {
      min_instance_count = 0
      max_instance_count = 5
    }
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
    ]
  }

  depends_on          = [google_project_service.run_api, null_resource.initial_database_setup]
  deletion_protection = false
}

# Studio Service
resource "google_cloud_run_v2_service" "studio" {
  name     = "supabase-studio"
  location = var.region
  project  = var.project_id
  ingress  = "INGRESS_TRAFFIC_INTERNAL_ONLY"

  template {
    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/app-artifact-repository/studio:latest"
      ports {
        container_port = 3000
      }
      env {
        name  = "STUDIO_PG_META_URL"
        value = "http://supabase-meta.${var.region}.internal"
      }
      env {
        name  = "POSTGRES_PASSWORD"
        value = var.db_password
      }
      env {
        name  = "SUPABASE_URL"
        value = "http://supabase-kong.${var.region}.internal"
      }
      env {
        name  = "SUPABASE_PUBLIC_URL"
        value = "https://api.${var.site_url}"
      }
      env {
        name  = "SUPABASE_ANON_KEY"
        value = var.anon_key
      }
      env {
        name  = "SUPABASE_SERVICE_ROLE_KEY"
        value = var.service_role_key
      }
      env {
        name  = "AUTH_JWT_SECRET"
        value = var.jwt_secret
      }
      env {
        name  = "LOGFLARE_PRIVATE_ACCESS_TOKEN"
        value = var.logflare_private_access_token
      }
      env {
        name  = "LOGFLARE_URL"
        value = "http://supabase-analytics.${var.region}.internal"
      }
      env {
        name  = "NEXT_PUBLIC_ENABLE_LOGS"
        value = false
      }
      env {
        name  = "NEXT_ANALYTICS_BACKEND_PROVIDER"
        value = "postgres"
      }
      env {
        name  = "DEFAULT_ORGANIZATION_NAME"
        value = "Default Organization"
      }
      env {
        name  = "DEFAULT_PROJECT_NAME"
        value = "Default Project"
      }
      env {
        name  = "OPENAI_API_KEY"
        value = ""
      }
    }

    scaling {
      min_instance_count = 0
      max_instance_count = 5
    }
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
    ]
  }

  depends_on = [
    google_cloud_run_v2_service.kong,
    google_cloud_run_v2_service.analytics,
    google_project_service.run_api,
    null_resource.initial_database_setup
  ]
  deletion_protection = false
}

# IAM bindings for internal service communication

# Analytics internal invoker
resource "google_cloud_run_v2_service_iam_member" "analytics_internal_kong" {
  name     = google_cloud_run_v2_service.analytics.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_cloud_run_v2_service.kong.template[0].service_account}"
}

# Auth internal invoker
resource "google_cloud_run_v2_service_iam_member" "auth_internal_kong" {
  name     = google_cloud_run_v2_service.auth.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_cloud_run_v2_service.kong.template[0].service_account}"
}

# Meta internal invoker (Kong)
resource "google_cloud_run_v2_service_iam_member" "meta_internal_kong" {
  name     = google_cloud_run_v2_service.meta.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_cloud_run_v2_service.kong.template[0].service_account}"
}

# Meta internal invoker (Studio)
resource "google_cloud_run_v2_service_iam_member" "meta_internal_studio" {
  name     = google_cloud_run_v2_service.meta.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_cloud_run_v2_service.studio.template[0].service_account}"
}

# Rest internal invoker
resource "google_cloud_run_v2_service_iam_member" "rest_internal_kong" {
  name     = google_cloud_run_v2_service.rest.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_cloud_run_v2_service.kong.template[0].service_account}"
}

# Studio internal invoker
resource "google_cloud_run_v2_service_iam_member" "studio_internal_kong" {
  name     = google_cloud_run_v2_service.studio.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_cloud_run_v2_service.kong.template[0].service_account}"
}

# Kong internal invoker (api)
resource "google_cloud_run_v2_service_iam_member" "kong_internal_api" {
  name     = google_cloud_run_v2_service.kong.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_cloud_run_v2_service.api.template[0].service_account}"
}

# Kong internal invoker (pdf_processor)
resource "google_cloud_run_v2_service_iam_member" "kong_internal_pdf_processor" {
  name     = google_cloud_run_v2_service.kong.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_cloud_run_v2_service.pdf_processor.template[0].service_account}"
}
