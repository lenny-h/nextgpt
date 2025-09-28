CREATE OR REPLACE FUNCTION public.update_profile(
    p_name varchar,
    p_username varchar,
    p_public boolean
) RETURNS void
SET search_path = 'public'
AS $$
BEGIN
    UPDATE profiles
    SET name = p_name,
        username = p_username,
        public = p_public
    WHERE id = (SELECT auth.uid());
END;
$$ LANGUAGE plpgsql;