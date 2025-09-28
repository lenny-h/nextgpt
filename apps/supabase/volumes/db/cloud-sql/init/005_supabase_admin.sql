-- migrate:up

-- Supabase super admin
CREATE USER supabase_auth_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;

GRANT ALL ON SCHEMA auth TO postgres, dashboard_user;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres, dashboard_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO postgres, dashboard_user;
GRANT ALL ON ALL ROUTINES IN SCHEMA auth TO postgres, dashboard_user;

-- update auth schema permissions
GRANT ALL PRIVILEGES ON SCHEMA auth TO supabase_auth_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth TO supabase_auth_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA auth TO supabase_auth_admin;
ALTER USER supabase_auth_admin SET search_path = "auth";
ALTER table IF EXISTS "auth".users OWNER TO supabase_auth_admin;
ALTER table IF EXISTS "auth".refresh_tokens OWNER TO supabase_auth_admin;
ALTER table IF EXISTS "auth".audit_log_entries OWNER TO supabase_auth_admin;
ALTER table IF EXISTS "auth".instances OWNER TO supabase_auth_admin;
ALTER table IF EXISTS "auth".schema_migrations OWNER TO supabase_auth_admin;

-- migrate:down