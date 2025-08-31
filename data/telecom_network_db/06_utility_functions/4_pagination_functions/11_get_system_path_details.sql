-- This function securely fetches the ordered segments for a specific logical path.
-- It ensures the calling user has RLS permission to view the source system of the path.

CREATE OR REPLACE FUNCTION public.get_system_path_details(
    p_path_id UUID
)
RETURNS SETOF public.v_system_ring_paths_detailed -- Returns rows matching the view's structure
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Security Check: The user can only get path details if they have permission
    -- to see the source system that this path belongs to.
    -- The EXISTS clause correctly and implicitly applies the RLS policies of the
    -- 'systems' table for the current user (auth.uid()).
    IF NOT EXISTS (
        SELECT 1
        FROM public.logical_fiber_paths lfp
        WHERE lfp.id = p_path_id
          AND EXISTS (SELECT 1 FROM public.systems s WHERE s.id = lfp.source_system_id)
    ) THEN
        -- If the user cannot see the source system, return an empty set.
        RETURN;
    END IF;

    -- If the security check passes, return the detailed path segments.
    RETURN QUERY
    SELECT *
    FROM public.v_system_ring_paths_detailed
    WHERE logical_path_id = p_path_id
    ORDER BY path_order ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_system_path_details(UUID) TO authenticated;