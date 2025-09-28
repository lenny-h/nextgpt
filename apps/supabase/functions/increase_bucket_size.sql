-- Create this function in Supabase SQL editor
CREATE OR REPLACE FUNCTION public.increase_bucket_size(p_bucket_id UUID, p_file_size BIGINT)
RETURNS VOID
SET search_path = 'public'
AS $$
BEGIN
  UPDATE buckets
  SET size = size + p_file_size
  WHERE id = p_bucket_id;
  
  -- Check if update succeeded
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bucket with ID % not found', p_bucket_id;
  END IF;
END;
$$ LANGUAGE plpgsql;