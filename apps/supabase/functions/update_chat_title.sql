CREATE OR REPLACE FUNCTION public.update_chat_title(
    p_chat_id uuid,
    p_title varchar
)
RETURNS void
LANGUAGE "sql"
SET search_path = 'public'
AS $$
  UPDATE chats
  SET title = p_title
  WHERE id = p_chat_id
  AND (user_id = (SELECT auth.uid()));
$$;