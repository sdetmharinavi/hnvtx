-- =================================================================
-- Section 3: Specialized Utility Functions (No Pagination)
-- =================================================================

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

CREATE OR REPLACE FUNCTION public.find_cable_between_nodes(
    p_node1_id UUID,
    p_node2_id UUID
)
RETURNS TABLE (id UUID, route_name TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT oc.id, oc.route_name
  FROM public.ofc_cables oc
  WHERE
    (oc.sn_id = p_node1_id AND oc.en_id = p_node2_id) OR
    (oc.sn_id = p_node2_id AND oc.en_id = p_node1_id)
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.find_cable_between_nodes(UUID, UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.deprovision_logical_path(p_path_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_working_path_id UUID;
    v_protection_path_id UUID;
BEGIN
    -- Find the working path ID, regardless if the input is a working or protection path ID
    SELECT
        CASE
            WHEN path_role = 'working' THEN id
            ELSE working_path_id
        END
    INTO v_working_path_id
    FROM public.logical_fiber_paths
    WHERE id = p_path_id OR working_path_id = p_path_id
    LIMIT 1;

    -- If a valid working path was found, find its associated protection path
    IF v_working_path_id IS NOT NULL THEN
        SELECT id INTO v_protection_path_id
        FROM public.logical_fiber_paths
        WHERE working_path_id = v_working_path_id;
    END IF;

    -- Clear the logical_path_id and fiber_role from all associated connections
    UPDATE public.ofc_connections
    SET
        logical_path_id = NULL,
        fiber_role = NULL
    WHERE logical_path_id = v_working_path_id OR logical_path_id = v_protection_path_id;

    -- Delete the logical_fiber_paths records themselves (cascading delete will handle protection path)
    DELETE FROM public.logical_fiber_paths WHERE id = v_working_path_id;
    
END;
$$;

GRANT EXECUTE ON FUNCTION public.deprovision_logical_path(UUID) TO authenticated;