-- Run as supabase_admin

-- migrate:up

ALTER DEFAULT PRIVILEGES IN SCHEMA auth
  GRANT ALL ON TABLES TO postgres, dashboard_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA auth
  GRANT ALL ON SEQUENCES TO postgres, dashboard_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA auth
  GRANT ALL ON ROUTINES TO postgres, dashboard_user;

-- migrate:down
