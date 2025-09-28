-- Function to update status to failed and adjust bucket size in a transaction
CREATE OR REPLACE FUNCTION public.update_status_to_failed(
  p_task_id UUID,
  p_bucket_id UUID
) RETURNS VOID
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  UPDATE tasks
  SET status = 'failed'
  WHERE id = p_task_id;
  
  UPDATE buckets
  SET size = size - (SELECT file_size FROM tasks WHERE id = p_task_id)
  WHERE id = p_bucket_id;
END;
$$;