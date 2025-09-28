CREATE OR REPLACE FUNCTION public.delete_document(p_id uuid)
RETURNS void
SET search_path = 'public'
AS $$
BEGIN
    DELETE FROM documents
    WHERE id = p_id AND user_id = (SELECT auth.uid());
END;
$$ LANGUAGE plpgsql;