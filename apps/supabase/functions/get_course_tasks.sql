CREATE OR REPLACE FUNCTION public.get_course_tasks(
    p_course_id uuid,
    page_number integer default 0,
    items_per_page integer default 10
)
RETURNS TABLE(
  id uuid,
  course_id uuid,
  name varchar,
  status task_status,
  created_at timestamp without time zone,
  pub_date timestamp without time zone
) 
LANGUAGE "sql" STABLE 
SET search_path = 'public'
AS $$
  SELECT t.id, t.course_id, t.name, t.status, t.created_at, t.pub_date
  FROM tasks t
  WHERE t.course_id = p_course_id 
    AND EXISTS (
      SELECT 1 
      FROM course_maintainers cm 
      WHERE cm.course_id = p_course_id
        AND cm.user_id = auth.uid()
    )
  ORDER BY t.created_at DESC
  LIMIT items_per_page
  OFFSET (page_number * items_per_page);
$$;