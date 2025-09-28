CREATE OR REPLACE FUNCTION public.get_is_favourite(
  p_chat_id uuid
)
RETURNS TABLE(
  is_favourite boolean
)
LANGUAGE "sql" STABLE
SET search_path = 'public'
AS $$
  SELECT is_favourite
  FROM chats
  WHERE id = p_chat_id
  AND (user_id = (SELECT auth.uid()));
$$;