CREATE OR REPLACE FUNCTION public.create_course(
  p_name VARCHAR,
  p_description TEXT,
  p_bucket_id UUID,
  p_user_id UUID,
  p_encrypted_key VARCHAR(256) DEFAULT NULL
) RETURNS UUID
SET search_path = 'public'
AS $$
DECLARE
  v_course_id UUID;
BEGIN
  -- Insert course
  INSERT INTO courses (name, description, bucket_id, private)
  VALUES (p_name, p_description, p_bucket_id, p_encrypted_key IS NOT NULL)
  RETURNING id INTO v_course_id;
  
  -- Insert maintainer
  INSERT INTO course_maintainers (course_id, user_id)
  VALUES (v_course_id, p_user_id);
  
  -- Insert encrypted key if provided
  IF p_encrypted_key IS NOT NULL THEN
    INSERT INTO course_keys (course_id, key)
    VALUES (v_course_id, p_encrypted_key);
  END IF;
  
  RETURN v_course_id;
END;
$$ LANGUAGE plpgsql;