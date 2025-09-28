CREATE OR REPLACE FUNCTION public.accept_invitation(
    p_invitation_type varchar,
    p_origin_user_id uuid,
    p_target_user_id uuid,
    p_resource_id uuid
)
RETURNS void
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
    IF p_invitation_type = 'user' THEN
        -- Insert the user into bucket_users if not exists
        INSERT INTO bucket_users(bucket_id, user_id)
        VALUES (p_resource_id, p_target_user_id)
        ON CONFLICT DO NOTHING;

        -- Increase the bucket user count
        UPDATE buckets
        SET users_count = users_count + 1
        WHERE id = p_resource_id;
        
        -- Delete the invitation
        DELETE FROM user_invitations
        WHERE origin = p_origin_user_id
        AND target = p_target_user_id
        AND bucket_id = p_resource_id;
    ELSIF p_invitation_type = 'course_maintainer' THEN
        -- Insert the user as a course maintainer if not exists
        INSERT INTO course_maintainers(course_id, user_id)
        VALUES (p_resource_id, p_target_user_id)
        ON CONFLICT DO NOTHING;
        
        -- Delete the invitation
        DELETE FROM course_maintainer_invitations
        WHERE origin = p_origin_user_id
        AND target = p_target_user_id
        AND course_id = p_resource_id;
    ELSIF p_invitation_type = 'bucket_maintainer' THEN
        -- Insert the user as a bucket maintainer if not exists
        INSERT INTO bucket_maintainers(bucket_id, user_id)
        VALUES (p_resource_id, p_target_user_id)
        ON CONFLICT DO NOTHING;
        
        -- Delete the invitation
        DELETE FROM bucket_maintainer_invitations
        WHERE origin = p_origin_user_id
        AND target = p_target_user_id
        AND bucket_id = p_resource_id;
    END IF;
END;
$$;
