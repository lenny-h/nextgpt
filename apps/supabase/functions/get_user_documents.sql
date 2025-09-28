CREATE OR REPLACE FUNCTION public.get_user_documents(
    page_number integer default 0,
    items_per_page integer default 10
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
    WHERE d.user_id = (select auth.uid())
    ORDER BY created_at DESC
    LIMIT items_per_page
    OFFSET (page_number * items_per_page);
END;
$$ LANGUAGE plpgsql;
