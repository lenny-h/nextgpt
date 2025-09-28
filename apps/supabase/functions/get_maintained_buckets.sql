CREATE OR REPLACE FUNCTION public.get_maintained_buckets()
RETURNS TABLE(
  id uuid, 
  owner uuid,
  name varchar,
  size bigint,
  max_size bigint,
  type bucket_type,
  users_count smallint,
  subscription_id varchar,
  created_at timestamp without time zone
)
LANGUAGE "sql" STABLE
SET search_path = 'public'
AS $$
  SELECT *
  FROM buckets
  WHERE id IN (
      SELECT bucket_id
      FROM bucket_maintainers
      WHERE user_id = auth.uid()
  )
  ORDER BY created_at DESC;
$$