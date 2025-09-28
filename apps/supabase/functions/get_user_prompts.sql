CREATE OR REPLACE FUNCTION public.get_user_prompts()
RETURNS TABLE(
    id uuid,
    name varchar,
    content text
)
SET search_path = 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.name, p.content
    FROM prompts p
    WHERE p.user_id = (select auth.uid());
END;
$$ LANGUAGE plpgsql;