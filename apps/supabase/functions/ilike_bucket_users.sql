CREATE OR REPLACE FUNCTION public.ilike_bucket_users(p_bucket_id uuid, prefix text)
RETURNS TABLE(
    id uuid,
    username varchar
)
SET search_path = 'public'
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM bucket_maintainers bm
        WHERE bm.bucket_id = p_bucket_id AND bm.user_id = (select auth.uid())
    ) THEN
        RETURN;  -- Return empty if the user is not owner of the bucket
    END IF;

    RETURN QUERY
    SELECT bu.user_id, p.username
    FROM bucket_users bu
    JOIN profiles p ON bu.user_id = p.id
    WHERE bu.bucket_id = p_bucket_id
    AND p.username ILIKE '%' || prefix || '%'
    LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
