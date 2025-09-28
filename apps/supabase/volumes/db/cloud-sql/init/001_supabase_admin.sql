-- Run as supabase_admin

-- migrate:up

-- Default privileges for sequences
alter default privileges in schema public
grant all on sequences to postgres, anon, authenticated, service_role;
-- Default privileges for tables
alter default privileges in schema public
grant all on tables to postgres, anon, authenticated, service_role;
-- Default privileges for functions
alter default privileges in schema public
grant all on functions to postgres, anon, authenticated, service_role;

CREATE SCHEMA IF NOT EXISTS auth;

-- migrate:down