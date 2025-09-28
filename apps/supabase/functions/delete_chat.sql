CREATE OR REPLACE FUNCTION public.delete_chat(
  p_chat_id uuid
)
RETURNS void
LANGUAGE "sql"
SET search_path = 'public'
AS $$
  DELETE
  FROM chats
  WHERE id = p_chat_id
  AND (user_id = (SELECT auth.uid()));
$$;