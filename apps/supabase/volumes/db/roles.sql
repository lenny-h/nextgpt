-- NOTE: change to your own passwords for production environments
\set pgpass `echo "$PGPASSWORD"`
\set pgbouncer_pass `echo "$PGBOUNCER_PASSWORD"`
\set supabase_auth_admin_pass `echo "$SUPABASE_AUTH_ADMIN_PASSWORD"`
\set supabase_functions_admin_pass `echo "$SUPABASE_FUNCTIONS_ADMIN_PASSWORD"`
\set supabase_storage_admin_pass `echo "$SUPABASE_STORAGE_ADMIN_PASSWORD"`

ALTER USER authenticator WITH PASSWORD :'pgpass';
ALTER USER pgbouncer WITH PASSWORD :'pgbouncer_pass';
ALTER USER supabase_auth_admin WITH PASSWORD :'supabase_auth_admin_pass';
ALTER USER supabase_functions_admin WITH PASSWORD :'supabase_functions_admin_pass';
ALTER USER supabase_storage_admin WITH PASSWORD :'supabase_storage_admin_pass';