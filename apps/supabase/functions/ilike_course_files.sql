CREATE OR REPLACE FUNCTION public.ilike_course_files(
    p_course_id uuid,
    prefix text
)
RETURNS TABLE(
    id uuid,
    course_id uuid,
    name varchar,
    size integer,
    created_at timestamp without time zone
)
SET search_path = 'public'
AS $$
BEGIN
    RETURN QUERY 
    SELECT
        f.id,
        f.course_id,
        f.name,
        f.size,
        f.created_at
    FROM files f
    WHERE f.course_id = p_course_id
    AND f.name ILIKE prefix || '%'
    ORDER BY f.created_at DESC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql;
