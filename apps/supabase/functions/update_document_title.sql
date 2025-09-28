CREATE OR REPLACE FUNCTION public.update_document_title(
    p_id uuid,
    p_title varchar
) RETURNS void
SET search_path = 'public'
AS $$
BEGIN
    UPDATE documents
    SET title = p_title
    WHERE id = p_id AND user_id = (SELECT auth.uid());
END;
$$ LANGUAGE plpgsql;