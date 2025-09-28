-- RPC to delete a file and update the corresponding bucket's size
CREATE OR REPLACE FUNCTION public.delete_file_and_update_bucket_size(
  p_file_id UUID,
  p_bucket_id UUID
) RETURNS VOID
SET search_path = 'public'
AS $$
DECLARE
  v_deleted_file_size BIGINT;
BEGIN
  -- Attempt to delete the file and retrieve its size
  DELETE FROM files
  WHERE id = p_file_id
  RETURNING size INTO v_deleted_file_size;

  -- If no file was deleted (file not found), raise an error
  IF NOT FOUND THEN
    RAISE EXCEPTION 'File not found with ID %', p_file_id;
  END IF;

  -- Update the bucket's size by subtracting the deleted file's size
  UPDATE buckets
  SET size = buckets.size - v_deleted_file_size
  WHERE id = p_bucket_id;

  -- If no bucket was updated (bucket not found), raise an error
  -- This ensures the transaction rolls back if the bucket doesn't exist
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bucket not found with ID %', p_bucket_id;
  END IF;
END;
$$ LANGUAGE plpgsql;
