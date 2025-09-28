CREATE OR REPLACE FUNCTION public.update_correction_prompt(
    p_id uuid,
    p_content text
) RETURNS void
SET search_path = 'public'
AS $$
BEGIN
    UPDATE prompts
    SET content = p_content
    WHERE id = p_id
    AND user_id = (SELECT auth.uid());
END;
$$ LANGUAGE plpgsql;