-- path: data/migrations/10_efiles/04_update_function.sql
-- Description: Adds capability to edit E-File metadata (Subject, Description, Priority).

CREATE OR REPLACE FUNCTION public.update_e_file_details(
    p_file_id UUID,
    p_subject TEXT,
    p_description TEXT,
    p_category TEXT,
    p_priority TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.e_files
    SET 
        subject = p_subject,
        description = p_description,
        category = p_category,
        priority = p_priority,
        updated_at = NOW()
    WHERE id = p_file_id;
    
    -- We don't insert into file_movements here because the location didn't change,
    -- only the metadata.
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_e_file_details(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;