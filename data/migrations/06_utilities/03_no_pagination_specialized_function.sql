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

CREATE OR REPLACE FUNCTION public.validate_ring_path(p_path_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_segment_count INT;
    v_first_segment RECORD;
    v_last_segment RECORD;
    v_is_continuous BOOLEAN;
    v_is_closed_loop BOOLEAN;
BEGIN
    -- Count segments in the path
    SELECT COUNT(*) INTO v_segment_count FROM logical_path_segments WHERE logical_path_id = p_path_id;

    IF v_segment_count = 0 THEN
        RETURN jsonb_build_object('status', 'empty', 'message', 'Path has no segments.');
    END IF;

    -- Get first and last segments using the detailed view
    SELECT * INTO v_first_segment FROM v_system_ring_paths_detailed WHERE logical_path_id = p_path_id ORDER BY path_order ASC LIMIT 1;
    SELECT * INTO v_last_segment FROM v_system_ring_paths_detailed WHERE logical_path_id = p_path_id ORDER BY path_order DESC LIMIT 1;

    -- Check for continuity (every segment's start node matches the previous segment's end node)
    SELECT NOT EXISTS (
        SELECT 1
        FROM v_system_ring_paths_detailed s1
        LEFT JOIN v_system_ring_paths_detailed s2 ON s1.logical_path_id = s2.logical_path_id AND s2.path_order = s1.path_order + 1
        WHERE s1.logical_path_id = p_path_id AND s2.id IS NOT NULL AND s1.end_node_id <> s2.start_node_id
    ) INTO v_is_continuous;

    IF NOT v_is_continuous THEN
        RETURN jsonb_build_object('status', 'broken', 'message', 'Path is not continuous. A segment connection is mismatched.');
    END IF;

    -- Check if the path forms a closed loop
    v_is_closed_loop := v_first_segment.start_node_id = v_last_segment.end_node_id;

    IF v_is_closed_loop THEN
        RETURN jsonb_build_object('status', 'valid_ring', 'message', 'Path forms a valid closed-loop ring.');
    ELSE
        RETURN jsonb_build_object('status', 'open_path', 'message', 'Path is a valid point-to-point route but not a closed ring.');
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_ring_path(UUID) TO authenticated;


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