-- path: data/migrations/07_diary/03_diary_functions.sql
-- Description: Creates a function to get diary notes for a specific date range, respecting user roles.

CREATE OR REPLACE FUNCTION public.get_diary_notes_for_range(
    start_date DATE,
    end_date DATE
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    full_name TEXT,
    note_date DATE,
    content TEXT,
    tags TEXT[],
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if the current user is a super_admin or has the 'admin' role.
    IF (is_super_admin() OR get_my_role() = 'admin') THEN
        -- Admins can see all notes in the date range and the user's full name.
        RETURN QUERY
        SELECT 
            d.id,
            d.user_id,
            p.full_name,
            d.note_date,
            d.content,
            d.tags,
            d.created_at,
            d.updated_at
        FROM public.diary_notes d
        LEFT JOIN public.v_user_profiles_extended p ON d.user_id = p.id
        WHERE d.note_date BETWEEN start_date AND end_date
        ORDER BY d.note_date DESC, p.full_name;
    ELSE
        -- Regular users can only see their own notes.
        RETURN QUERY
        SELECT 
            d.id,
            d.user_id,
            p.full_name,
            d.note_date,
            d.content,
            d.tags,
            d.created_at,
            d.updated_at
        FROM public.diary_notes d
        LEFT JOIN public.v_user_profiles_extended p ON d.user_id = p.id
        WHERE d.user_id = auth.uid()
          AND d.note_date BETWEEN start_date AND end_date
        ORDER BY d.note_date DESC;
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_diary_notes_for_range(DATE, DATE) TO authenticated;