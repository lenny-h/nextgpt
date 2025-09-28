CREATE OR REPLACE FUNCTION public.ilike_user_chats(
    prefix text
)
RETURNS TABLE(
    id uuid,
    user_id uuid,
    title varchar,
    is_favourite boolean,
    created_at timestamp without time zone
)
SET search_path = 'public'
AS $$
BEGIN
    RETURN QUERY 
    SELECT 
        c.id,
        c.user_id,
        c.title,
        c.is_favourite,
        c.created_at
    FROM chats c
    WHERE c.user_id = (SELECT auth.uid())
    AND c.title ILIKE '%' || prefix || '%'
    LIMIT 3;
END;
$$ LANGUAGE plpgsql;
