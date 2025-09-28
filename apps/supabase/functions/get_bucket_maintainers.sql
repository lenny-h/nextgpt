CREATE OR REPLACE FUNCTION public.get_bucket_maintainers(p_bucket_id uuid)
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
        RETURN;  -- Return empty if the user is not a maintainer
    END IF;

    RETURN QUERY
    SELECT bm.user_id, p.username
    FROM bucket_maintainers bm
    JOIN profiles p ON bm.user_id = p.id
    WHERE bm.bucket_id = p_bucket_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;