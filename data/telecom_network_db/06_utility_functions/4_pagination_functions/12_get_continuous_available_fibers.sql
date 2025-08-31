-- REFACTORED: This is the most robust version of the function.
-- It ensures correct counting and avoids potential GROUP BY pitfalls.
CREATE OR REPLACE FUNCTION public.get_continuous_available_fibers(
    p_path_id UUID
) RETURNS TABLE(fiber_no INT) AS $$
DECLARE
    path_cable_count INT;
BEGIN
    -- Step 1: Get the total number of unique physical cable segments in the path.
    SELECT COUNT(DISTINCT seg.ofc_cable_id)
    INTO path_cable_count
    FROM public.logical_path_segments seg
    WHERE seg.logical_path_id = p_path_id AND seg.ofc_cable_id IS NOT NULL;

    -- If the path has no cable segments, there are no fibers to return.
    IF COALESCE(path_cable_count, 0) = 0 THEN
        RETURN;
    END IF;

    -- Step 2: Find all fiber numbers that appear on exactly `path_cable_count` cables within the path.
    RETURN QUERY
    SELECT
        conn.fiber_no_sn::INT
    FROM
        public.ofc_connections conn
    -- This JOIN ensures we only consider connections on the cables in our specific path.
    JOIN public.logical_path_segments seg ON conn.ofc_id = seg.ofc_cable_id
    WHERE
        seg.logical_path_id = p_path_id
        -- And the fiber must be unassigned and active.
        AND conn.logical_path_id IS NULL
        AND conn.status = TRUE
    GROUP BY
        conn.fiber_no_sn
    -- The crucial check:
    HAVING
        COUNT(conn.ofc_id) = path_cable_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION public.get_continuous_available_fibers(UUID) TO authenticated;