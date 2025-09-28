CREATE OR REPLACE FUNCTION public.get_maintained_courses(
    page_number integer default 0,
    items_per_page integer default 10
)
RETURNS TABLE(
    id uuid,
    name varchar,
    description text,
    bucket_id uuid,
    bucket_name varchar,
    created_at timestamp without time zone,
    private boolean
) 
LANGUAGE "sql" STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
    SELECT c.id, c.name, c.description, c.bucket_id, b.name, c.created_at, c.private
    FROM course_maintainers cm
    JOIN courses c ON cm.course_id = c.id
    JOIN buckets b ON c.bucket_id = b.id
    WHERE cm.user_id = (SELECT auth.uid())
    ORDER BY c.created_at DESC
    LIMIT items_per_page
    OFFSET (page_number * items_per_page);
$$;
