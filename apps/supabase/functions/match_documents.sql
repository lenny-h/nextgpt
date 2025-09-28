-- Procedure to match documents based on vector similarity
CREATE OR REPLACE FUNCTION public.match_documents(
  query_embedding vector(768),
  course_ids UUID[] DEFAULT NULL,
  file_ids UUID[] DEFAULT NULL,
  retrieve_content BOOLEAN DEFAULT FALSE,
  match_threshold FLOAT DEFAULT 0.5,
  match_count INTEGER DEFAULT 4
)
RETURNS TABLE (
  id UUID,
  file_id UUID,
  file_name VARCHAR,
  course_id UUID,
  course_name VARCHAR,
  page_index SMALLINT,
  content TEXT,
  similarity FLOAT
)
SET search_path = 'public', 'extensions'
AS $$
BEGIN
  IF file_ids IS NULL AND course_ids IS NULL THEN
      RAISE EXCEPTION 'At least one of file_ids or course_ids must be provided';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.file_id,
    p.file_name,
    p.course_id,
    p.course_name,
    p.page_index,
    CASE WHEN retrieve_content THEN p.content ELSE NULL END as content,
    (1 - (p.embedding <=> query_embedding)) AS similarity
  FROM pages p
  WHERE 
    (1 - (p.embedding <=> query_embedding)) > match_threshold
    AND (file_ids   IS NULL OR p.file_id   = ANY(file_ids))
    AND (course_ids IS NULL OR p.course_id = ANY(course_ids))
  ORDER BY 
    similarity DESC
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;