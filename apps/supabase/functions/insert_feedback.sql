CREATE OR REPLACE FUNCTION public.insert_feedback(
    p_subject varchar,
    p_content text
) 
RETURNS void 
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
    IF length(p_subject) >= 64 THEN
        RAISE EXCEPTION 'Subject must be less than 64 characters';
    END IF;

    IF length(p_content) >= 512 THEN
        RAISE EXCEPTION 'Content must be less than 512 characters';
    END IF;

    INSERT INTO feedback (user_id, subject, content) 
    VALUES ((select auth.uid()), p_subject, p_content);
END;
$$;