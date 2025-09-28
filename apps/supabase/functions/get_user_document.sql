CREATE OR REPLACE FUNCTION public.get_user_document(p_id uuid)
RETURNS TABLE(
    content text
)
SET search_path = 'public'
AS $$
BEGIN
    RETURN QUERY 
    SELECT 
        d.content
    FROM documents d
    WHERE d.id = p_id
    AND d.user_id = (select auth.uid())
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;
