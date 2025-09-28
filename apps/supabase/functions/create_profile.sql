CREATE OR REPLACE FUNCTION public.create_profile(
    p_name varchar,
    p_username varchar,
    p_public boolean DEFAULT false
) RETURNS void
SET search_path = 'public'
AS $$
BEGIN
    INSERT INTO profiles (id, name, username, public)
    VALUES ((select auth.uid()), p_name, p_username, p_public);
END;
$$ LANGUAGE plpgsql;