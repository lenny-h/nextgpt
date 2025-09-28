CREATE OR REPLACE FUNCTION public.get_messages(
    p_chat_id uuid
)
RETURNS TABLE (
    id uuid,
    role role,
    parts json,
    metadata json
)
LANGUAGE "sql" STABLE
SET search_path = 'public'
AS $$
    SELECT id, role, parts, metadata
    FROM messages
    WHERE chat_id = p_chat_id
    ORDER BY created_at ASC;
$$;