CREATE OR REPLACE FUNCTION get_course_maintainers(p_course_id uuid)
RETURNS TABLE(
    id uuid,
    username varchar
)
SET search_path = 'public'
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM course_maintainers cm
        WHERE cm.course_id = p_course_id AND cm.user_id = (select auth.uid())
    ) THEN
        RETURN;  -- Return empty if the user is not a maintainer
    END IF;

    RETURN QUERY
    SELECT cm.user_id, p.username
    FROM course_maintainers cm
    JOIN profiles p ON cm.user_id = p.id
    WHERE cm.course_id = p_course_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;