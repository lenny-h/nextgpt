CREATE OR REPLACE FUNCTION public.get_user_chats(
  page_number integer default 0,
  items_per_page integer default 10
)
RETURNS TABLE(
  id uuid, 
  user_id uuid,
  title varchar,
  is_favourite boolean,
  created_at timestamp without time zone
)
LANGUAGE "sql" STABLE
SET search_path = 'public'
AS $$
  SELECT c.id, c.user_id, c.title, c.is_favourite, c.created_at
  FROM chats c
  WHERE c.user_id = (SELECT auth.uid())
  ORDER BY created_at DESC
  LIMIT items_per_page
  OFFSET (page_number * items_per_page);
$$