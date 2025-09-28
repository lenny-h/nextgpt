CREATE OR REPLACE FUNCTION public.create_bucket(
  p_owner UUID,
  p_name VARCHAR,
  p_type BUCKET_TYPE,
  p_max_size BIGINT
) RETURNS UUID
SET search_path = 'public'
AS $$
DECLARE
  v_bucket_id UUID;
BEGIN
  -- Insert bucket
  INSERT INTO buckets (owner, name, type, users_count, max_size)
  VALUES (p_owner, p_name, p_type, 1, p_max_size)
  RETURNING id INTO v_bucket_id;

  -- Insert bucket maintainer
  INSERT INTO bucket_maintainers (bucket_id, user_id)
  VALUES (v_bucket_id, p_owner);
  
  -- Insert bucket user
  INSERT INTO bucket_users (bucket_id, user_id)
  VALUES (v_bucket_id, p_owner);
  
  RETURN v_bucket_id;
END;
$$ LANGUAGE plpgsql;