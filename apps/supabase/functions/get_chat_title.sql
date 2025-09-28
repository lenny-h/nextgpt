CREATE OR REPLACE FUNCTION public.get_chat_title(
  p_chat_id uuid
)
RETURNS TABLE (
  title varchar
)
LANGUAGE "sql" STABLE
SET search_path = 'public'
AS $$
  SELECT title
  FROM chats
  WHERE id = p_chat_id
  AND user_id = (SELECT auth.uid())
  LIMIT 1;
$$;