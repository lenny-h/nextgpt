CREATE OR REPLACE FUNCTION get_bucket_users(p_bucket_id uuid)
RETURNS TABLE(
    id uuid,
    username varchar
) AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM public.bucket_maintainers bm
        WHERE bm.bucket_id = p_bucket_id AND bm.user_id = (select auth.uid())
    ) THEN
        RETURN;  -- Return empty if the user is not a maintainer of the bucket
    END IF;

    RETURN QUERY
    SELECT bu.user_id, p.username
    FROM public.bucket_users bu
    JOIN public.profiles p ON bu.user_id = p.id
    WHERE bu.bucket_id = p_bucket_id
    LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;