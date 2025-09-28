CREATE OR REPLACE FUNCTION public.get_user_buckets()
RETURNS TABLE(
    bucket_id uuid,
    name varchar,
    type bucket_type
)
SET search_path = 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT bu.bucket_id, b.name, b.type
    FROM bucket_users bu
    JOIN buckets b ON bu.bucket_id = b.id
    WHERE bu.user_id = (SELECT auth.uid());
END;
$$ LANGUAGE plpgsql;