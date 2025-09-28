CREATE OR REPLACE FUNCTION public.get_chat(
    p_chat_id uuid
)
RETURNS TABLE (
    id uuid
)
LANGUAGE "sql" STABLE
SET search_path = 'public'
AS $$
BEGIN
    SELECT id
    FROM chats
    WHERE id = p_chat_id AND user_id = (SELECT auth.uid());
END;
$$;