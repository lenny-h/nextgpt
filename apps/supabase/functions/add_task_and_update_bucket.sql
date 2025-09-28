CREATE OR REPLACE FUNCTION public.add_task_and_update_bucket(
  p_id uuid, 
  p_course_id uuid, 
  p_name varchar, 
  p_file_size bigint,
  p_pub_date timestamp without time zone default null
)
RETURNS void
SET search_path = 'public'
AS $$
DECLARE
  v_bucket_id uuid;
BEGIN
  -- Get the bucket ID for the course
  SELECT bucket_id INTO v_bucket_id FROM courses WHERE id = p_course_id;
  
  IF v_bucket_id IS NULL THEN
    raise exception 'Course not found';
  END IF;

  -- Insert the task
  INSERT INTO tasks (id, course_id, file_size, name, pub_date)
  VALUES (p_id, p_course_id, p_file_size, p_name, p_pub_date);

  -- Update the bucket size
  UPDATE buckets
  SET size = size + p_file_size
  WHERE id = v_bucket_id;
END;
$$ LANGUAGE plpgsql;