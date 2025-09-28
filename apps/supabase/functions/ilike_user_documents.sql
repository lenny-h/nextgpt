CREATE OR REPLACE FUNCTION public.ilike_user_documents(
    prefix text
)
RETURNS TABLE(
    id uuid,
    title varchar,
    kind document_kind,
    created_at timestamp without time zone
)
SET search_path = 'public'
AS $$
BEGIN
    RETURN QUERY 
    SELECT 
        d.id,
        d.title,
        d.kind,
        d.created_at
    FROM documents d
    WHERE d.user_id = (SELECT auth.uid())
    AND d.title ILIKE '%' || prefix || '%'
    LIMIT 3;
END;
$$ LANGUAGE plpgsql;
