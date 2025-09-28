CREATE OR REPLACE FUNCTION public.delete_invitation(
    p_invitation_type varchar,
    p_origin uuid,
    p_target uuid,
    p_resource_id uuid
)
RETURNS void
SET search_path = 'public'
AS $$
BEGIN
    IF p_invitation_type = 'user' THEN
        DELETE FROM user_invitations
        WHERE origin = p_origin
        AND target = p_target
        AND bucket_id = p_resource_id;
    ELSIF p_invitation_type = 'course_maintainer' THEN
        DELETE FROM course_maintainer_invitations
        WHERE origin = p_origin
        AND target = p_target
        AND course_id = p_resource_id;
    ELSIF p_invitation_type = 'bucket_maintainer' THEN
        DELETE FROM bucket_maintainer_invitations
        WHERE origin = p_origin
        AND target = p_target
        AND bucket_id = p_resource_id;
    END IF;
END;
$$ LANGUAGE plpgsql;
