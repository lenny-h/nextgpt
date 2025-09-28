-- migrate:up

ALTER ROLE supabase_admin SET search_path TO "\$user",public,auth,extensions;
ALTER ROLE postgres SET search_path TO "\$user",public,extensions;

-- Supabase dashboard user
CREATE ROLE dashboard_user CREATEDB CREATEROLE REPLICATION;
GRANT ALL ON DATABASE postgres TO dashboard_user;
GRANT ALL ON SCHEMA extensions TO dashboard_user;
GRANT ALL ON ALL TABLES IN SCHEMA extensions TO dashboard_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA extensions TO dashboard_user;
GRANT ALL ON ALL ROUTINES IN SCHEMA extensions TO dashboard_user;

-- migrate:down
