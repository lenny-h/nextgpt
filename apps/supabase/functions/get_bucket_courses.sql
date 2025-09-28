CREATE OR REPLACE FUNCTION public.get_bucket_courses(
    p_bucket_id uuid,
    page_number integer DEFAULT 0,
    items_per_page integer DEFAULT 10
)
RETURNS TABLE(
    id uuid,
    name varchar,
    private boolean
) 
LANGUAGE SQL STABLE 
SET SEARCH_PATH = 'public'
AS $$
    SELECT id, name, private
    FROM courses
    WHERE bucket_id = p_bucket_id
    ORDER BY created_at DESC
    LIMIT items_per_page
    OFFSET (page_number * items_per_page);
$$;