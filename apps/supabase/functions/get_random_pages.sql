CREATE OR REPLACE FUNCTION get_random_pages(
    p_file_ids UUID[],
    retrieve_content BOOLEAN DEFAULT FALSE
)
RETURNS TABLE(
    id UUID,
    file_id UUID, 
    file_name VARCHAR,
    course_id UUID,
    course_name VARCHAR,
    page_index SMALLINT,
    content TEXT
)
SET search_path = 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.file_id,
        p.file_name,
        p.course_id,
        p.course_name,
        p.page_index,
        CASE WHEN retrieve_content THEN p.content ELSE NULL END as content
    FROM pages p
    WHERE p.file_id = ANY(p_file_ids)
    ORDER BY random()
    LIMIT 4;
END;
$$ LANGUAGE plpgsql;