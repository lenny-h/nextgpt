CREATE OR REPLACE FUNCTION public.get_outgoing_invitations(
    invitation_type varchar, -- 'user', 'course_maintainer', or 'bucket_maintainer'
    page_number integer default 0,
    items_per_page integer default 10
)
RETURNS TABLE(
    origin uuid,
    target uuid,
    target_username varchar,
    resource_id uuid, -- bucket_id or course_id depending on type
    created_at timestamp without time zone,
    resource_name varchar -- bucket_name or course_name depending on type
)
LANGUAGE "plpgsql" STABLE
SET search_path = 'public'
AS $$
BEGIN
    IF invitation_type = 'user' THEN
        RETURN query
        SELECT 
            ui.origin,
            ui.target,
            p.username AS target_username,
            ui.bucket_id AS resource_id,
            ui.created_at,
            ui.bucket_name AS resource_name
        FROM user_invitations ui
        JOIN profiles p ON p.id = ui.target
        WHERE ui.origin = auth.uid()
        ORDER BY ui.created_at DESC
        LIMIT items_per_page
        OFFSET (page_number * items_per_page);
    ELSIF invitation_type = 'course_maintainer' THEN
        RETURN query
        SELECT 
            cmi.origin,
            cmi.target,
            p.username AS target_username,
            cmi.course_id AS resource_id,
            cmi.created_at,
            cmi.course_name AS resource_name
        FROM course_maintainer_invitations cmi
        JOIN profiles p ON p.id = cmi.target
        WHERE cmi.origin = auth.uid()
        ORDER BY cmi.created_at DESC
        LIMIT items_per_page
        OFFSET (page_number * items_per_page);
    ELSIF invitation_type = 'bucket_maintainer' THEN
        RETURN query
        SELECT 
            bmi.origin,
            bmi.target,
            p.username AS target_username,
            bmi.bucket_id AS resource_id,
            bmi.created_at,
            bmi.bucket_name AS resource_name
        FROM bucket_maintainer_invitations bmi
        JOIN profiles p ON p.id = bmi.target
        WHERE bmi.origin = auth.uid()
        ORDER BY bmi.created_at DESC
        LIMIT items_per_page
        OFFSET (page_number * items_per_page);
    END IF;
END;
$$;
