CREATE OR REPLACE FUNCTION public.get_user_models(p_bucket_id uuid)
RETURNS TABLE(
    id uuid,
    name varchar,
    description varchar
) 
LANGUAGE "sql" STABLE 
SET search_path = 'public'
AS $$
    SELECT m.id, m.name, m.description
    FROM models m
    WHERE m.bucket_id = p_bucket_id
    ORDER BY m.created_at DESC;
$$;