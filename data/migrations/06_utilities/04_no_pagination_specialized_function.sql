-- =================================================================
-- Section 3: Specialized Utility Functions (No Pagination)
-- =================================================================

CREATE OR REPLACE FUNCTION public.get_system_path_details(p_path_id UUID)
RETURNS SETOF public.v_system_ring_paths_detailed LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.logical_fiber_paths lfp WHERE lfp.id = p_path_id AND EXISTS (SELECT 1 FROM public.systems s WHERE s.id = lfp.source_system_id)) THEN
        RETURN;
    END IF;
    RETURN QUERY SELECT * FROM public.v_system_ring_paths_detailed WHERE logical_path_id = p_path_id ORDER BY path_order ASC;
END; $$;
GRANT EXECUTE ON FUNCTION public.get_system_path_details(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_continuous_available_fibers(p_path_id UUID)
RETURNS TABLE(fiber_no INT) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE path_cable_count INT;
BEGIN
    SELECT COUNT(DISTINCT seg.ofc_cable_id) INTO path_cable_count FROM public.logical_path_segments seg WHERE seg.logical_path_id = p_path_id AND seg.ofc_cable_id IS NOT NULL;
    IF COALESCE(path_cable_count, 0) = 0 THEN RETURN; END IF;
    RETURN QUERY SELECT conn.fiber_no_sn::INT FROM public.ofc_connections conn JOIN public.logical_path_segments seg ON conn.ofc_id = seg.ofc_cable_id
    WHERE seg.logical_path_id = p_path_id AND conn.logical_path_id IS NULL AND conn.status = TRUE
    GROUP BY conn.fiber_no_sn HAVING COUNT(conn.ofc_id) = path_cable_count;
END; $$;
GRANT EXECUTE ON FUNCTION public.get_continuous_available_fibers(UUID) TO authenticated;