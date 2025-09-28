CREATE OR REPLACE FUNCTION public.delete_correction_prompt(
    p_id uuid
)
RETURNS void
SET search_path = 'public'
AS $$
BEGIN
    DELETE FROM prompts
    WHERE id = p_id
    AND user_id = (SELECT auth.uid());
END;
$$ LANGUAGE plpgsql;