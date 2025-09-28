CREATE OR REPLACE FUNCTION public.get_course_files(
  p_course_id uuid,
  page_number integer default 0,
  items_per_page integer default 10
)
RETURNS TABLE(
  id uuid,
  course_id uuid,
  name varchar,
  size integer,
  created_at timestamp without time zone
) 
LANGUAGE sql stable
SET search_path = 'public'
AS $$
  SELECT f.id, f.course_id, f.name, f.size, f.created_at
  FROM files f
  WHERE f.course_id = p_course_id 
  ORDER BY f.created_at DESC
  LIMIT items_per_page
  OFFSET (page_number * items_per_page);
$$;