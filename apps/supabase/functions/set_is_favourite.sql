CREATE OR REPLACE FUNCTION public.set_is_favourite(
  p_chat_id uuid,
  p_is_favourite boolean
)
RETURNS void
LANGUAGE "sql"
SET search_path = 'public'
AS $$
  UPDATE chats
  SET is_favourite = p_is_favourite
  WHERE id = p_chat_id
  AND (user_id = (SELECT auth.uid()));
$$;