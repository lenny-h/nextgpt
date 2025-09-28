CREATE OR REPLACE FUNCTION public.ilike_public_profiles(prefix text)
RETURNS TABLE(
  id uuid,
  username varchar
)
LANGUAGE SQL STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT p.id, p.username
  FROM profiles p
  WHERE p.public = true
  AND p.username ILIKE '%' || prefix || '%';
$$;


REVOKE ALL ON FUNCTION ilike_public_profiles FROM public;
GRANT EXECUTE ON FUNCTION ilike_public_profiles TO authenticated;