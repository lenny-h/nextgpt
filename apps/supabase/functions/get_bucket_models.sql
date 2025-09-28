CREATE OR REPLACE FUNCTION public.get_bucket_models()
RETURNS TABLE(
    id uuid,
    bucket_id uuid,
    bucket_name varchar,
    name varchar,
    created_at timestamp without time zone
) 
LANGUAGE sql stable
SET search_path = 'public'
AS $$
    SELECT m.id, m.bucket_id, b.name AS bucket_name, m.name, m.created_at
    FROM models m
    JOIN buckets b ON m.bucket_id = b.id
    WHERE b.owner = (SELECT auth.uid())
    ORDER BY m.created_at DESC;
$$;
