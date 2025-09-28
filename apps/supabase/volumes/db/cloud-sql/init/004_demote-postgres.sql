-- migrate:up

-- demote postgres user
GRANT ALL ON DATABASE postgres TO postgres;
GRANT ALL ON SCHEMA extensions TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA extensions TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA extensions TO postgres;
GRANT ALL ON ALL ROUTINES IN SCHEMA extensions TO postgres;

-- migrate:down
