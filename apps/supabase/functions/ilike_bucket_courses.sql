CREATE OR REPLACE FUNCTION public.ilike_bucket_courses(
    p_bucket_id uuid,
    prefix text
)
RETURNS TABLE(
    id uuid,
    name varchar,
    private boolean
)
SET search_path = 'public'
AS $$
BEGIN
    RETURN QUERY 
    SELECT
        c.id,
        c.name,
        c.private
    FROM courses c
    WHERE c.bucket_id = p_bucket_id
    AND c.name ILIKE prefix || '%'
    LIMIT 5;
END;
$$ LANGUAGE plpgsql;
