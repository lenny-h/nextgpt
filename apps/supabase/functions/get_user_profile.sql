CREATE OR REPLACE FUNCTION public.get_user_profile()
RETURNS TABLE(
  id uuid,
  name varchar,
  username varchar,
  public boolean
)
LANGUAGE "sql" STABLE
SET search_path = 'public'
AS $$
  SELECT p.id, p.name, p.username, p.public
  FROM profiles p
  WHERE p.id = auth.uid();
$$;