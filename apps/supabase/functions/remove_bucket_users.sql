CREATE OR REPLACE FUNCTION remove_bucket_users(p_bucket_id uuid, p_user_ids uuid[])
RETURNS int
SET search_path = 'public'
AS $$
DECLARE
    removed_count int;
BEGIN
    -- Check if the current user is a maintainer of the bucket
    IF NOT EXISTS (
        SELECT 1
        FROM bucket_maintainers bm
        WHERE bm.bucket_id = p_bucket_id AND bm.user_id = (SELECT auth.uid())
    ) THEN
        RETURN 0;  -- Return 0 if the user is not a maintainer
    END IF;

    -- Delete the specified users from bucket_users
    WITH deleted_rows AS (
        DELETE FROM bucket_users bu
        WHERE bu.bucket_id = p_bucket_id 
        AND bu.user_id = ANY(p_user_ids)
        RETURNING bu.user_id
    )
    SELECT count(*) INTO removed_count FROM deleted_rows;
    
    -- Update the users_count in the buckets table
    IF removed_count > 0 THEN
        UPDATE buckets
        SET users_count = users_count - removed_count
        WHERE id = p_bucket_id;
    END IF;
    
    RETURN removed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
