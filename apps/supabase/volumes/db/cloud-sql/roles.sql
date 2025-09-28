-- NOTE: change to your own passwords for production environments
\set pgpass `echo "$PGPASSWORD"`
\set supabase_auth_admin_pass `echo "$SUPABASE_AUTH_ADMIN_PASSWORD"`

ALTER USER authenticator WITH PASSWORD :'pgpass';
ALTER USER supabase_auth_admin WITH PASSWORD :'supabase_auth_admin_pass';