-- =================================================================
-- Section 4: OFC and Splicing Specific Utility Functions
-- [FULLY CORRECTED AND SEGMENT-AWARE]
-- =================================================================

-- Description: Provisions a working and protection fiber pair on a logical path.
CREATE OR REPLACE FUNCTION public.provision_logical_path(
    p_path_name TEXT,
    p_physical_path_id UUID,
    p_working_fiber_no INT,
    p_protection_fiber_no INT,
    p_system_id UUID
)
RETURNS TABLE(working_path_id UUID, protection_path_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_working_path_id UUID;
    v_protection_path_id UUID;
    v_active_status_id UUID;
BEGIN
    SELECT id INTO v_active_status_id FROM public.lookup_types WHERE category = 'OFC_PATH_STATUSES' AND name = 'active' LIMIT 1;
    IF v_active_status_id IS NULL THEN RAISE EXCEPTION 'Operational status "active" not found in lookup_types.'; END IF;

    INSERT INTO public.logical_fiber_paths (path_name, source_system_id, path_role, operational_status_id)
    VALUES (p_path_name || ' (Working)', p_system_id, 'working', v_active_status_id) RETURNING id INTO v_working_path_id;

    INSERT INTO public.logical_fiber_paths (path_name, source_system_id, path_role, working_path_id, operational_status_id)
    VALUES (p_path_name || ' (Protection)', p_system_id, 'protection', v_working_path_id, v_active_status_id) RETURNING id INTO v_protection_path_id;

    UPDATE public.ofc_connections SET logical_path_id = v_working_path_id, fiber_role = 'working'
    WHERE fiber_no_sn = p_working_fiber_no AND ofc_id IN (
        SELECT lps.ofc_cable_id FROM logical_path_segments lps WHERE lps.logical_path_id = p_physical_path_id
    );

    UPDATE public.ofc_connections SET logical_path_id = v_protection_path_id, fiber_role = 'protection'
    WHERE fiber_no_sn = p_protection_fiber_no AND ofc_id IN (
        SELECT lps.ofc_cable_id FROM logical_path_segments lps WHERE lps.logical_path_id = p_physical_path_id
    );

    RETURN QUERY SELECT v_working_path_id, v_protection_path_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.provision_logical_path(TEXT, UUID, INT, INT, UUID) TO authenticated;


-- Description: Automatically create 1-to-1 "straight" splices for available fibers between two segments.
-- FIX: This function now accepts SEGMENT IDs, not cable IDs.
CREATE OR REPLACE FUNCTION public.auto_splice_straight_segments(p_jc_id UUID, p_segment1_id UUID, p_segment2_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    segment1_fibers INT; segment2_fibers INT; i INT; splice_count INT := 0;
    available_fibers_s1 INT[]; available_fibers_s2 INT[];
BEGIN
    SELECT fiber_count INTO segment1_fibers FROM public.cable_segments WHERE id = p_segment1_id;
    SELECT fiber_count INTO segment2_fibers FROM public.cable_segments WHERE id = p_segment2_id;
    IF segment1_fibers IS NULL OR segment2_fibers IS NULL THEN RAISE EXCEPTION 'One or both segments not found.'; END IF;

    SELECT array_agg(s.i) INTO available_fibers_s1 FROM generate_series(1, segment1_fibers) s(i)
    WHERE NOT EXISTS (SELECT 1 FROM public.fiber_splices fs WHERE fs.jc_id = p_jc_id AND ((fs.incoming_segment_id = p_segment1_id AND fs.incoming_fiber_no = s.i) OR (fs.outgoing_segment_id = p_segment1_id AND fs.outgoing_fiber_no = s.i)));
    SELECT array_agg(s.i) INTO available_fibers_s2 FROM generate_series(1, segment2_fibers) s(i)
    WHERE NOT EXISTS (SELECT 1 FROM public.fiber_splices fs WHERE fs.jc_id = p_jc_id AND ((fs.incoming_segment_id = p_segment2_id AND fs.incoming_fiber_no = s.i) OR (fs.outgoing_segment_id = p_segment2_id AND fs.outgoing_fiber_no = s.i)));

    FOR i IN 1..LEAST(cardinality(available_fibers_s1), cardinality(available_fibers_s2)) LOOP
        INSERT INTO public.fiber_splices (jc_id, incoming_segment_id, incoming_fiber_no, outgoing_segment_id, outgoing_fiber_no, splice_type)
        VALUES (p_jc_id, p_segment1_id, available_fibers_s1[i], p_segment2_id, available_fibers_s2[i], 'pass_through');
        splice_count := splice_count + 1;
    END LOOP;
    RETURN jsonb_build_object('status', 'success', 'splices_created', splice_count);
END;
$$;
GRANT EXECUTE ON FUNCTION public.auto_splice_straight_segments(UUID, UUID, UUID) TO authenticated;


-- Description: RPC function to handle creating, deleting, and updating splices.
-- FIX: This function now accepts SEGMENT IDs.
CREATE OR REPLACE FUNCTION public.manage_splice(
    p_action TEXT, p_jc_id UUID, p_splice_id UUID DEFAULT NULL, p_incoming_segment_id UUID DEFAULT NULL,
    p_incoming_fiber_no INT DEFAULT NULL, p_outgoing_segment_id UUID DEFAULT NULL, p_outgoing_fiber_no INT DEFAULT NULL,
    p_splice_type TEXT DEFAULT 'pass_through', p_otdr_length_km NUMERIC DEFAULT NULL
)
RETURNS RECORD
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result RECORD;
BEGIN
    IF p_action = 'create' THEN
        INSERT INTO public.fiber_splices (jc_id, incoming_segment_id, incoming_fiber_no, outgoing_segment_id, outgoing_fiber_no, splice_type, otdr_length_km)
        VALUES (p_jc_id, p_incoming_segment_id, p_incoming_fiber_no, p_outgoing_segment_id, p_outgoing_fiber_no, p_splice_type, p_otdr_length_km)
        RETURNING id, 'created' INTO result;
    ELSIF p_action = 'delete' THEN
        DELETE FROM public.fiber_splices WHERE id = p_splice_id AND jc_id = p_jc_id RETURNING id, 'deleted' INTO result;
        IF NOT FOUND THEN RAISE EXCEPTION 'Splice not found.'; END IF;
    ELSIF p_action = 'update_otdr' THEN
        UPDATE public.fiber_splices SET otdr_length_km = p_otdr_length_km, updated_at = now()
        WHERE id = p_splice_id AND jc_id = p_jc_id RETURNING id, 'updated' INTO result;
        IF NOT FOUND THEN RAISE EXCEPTION 'Splice not found.'; END IF;
    ELSE
        RAISE EXCEPTION 'Invalid action specified.';
    END IF;
    RETURN result;
END;
$$;
GRANT EXECUTE ON FUNCTION public.manage_splice(TEXT, UUID, UUID, UUID, INT, UUID, INT, TEXT, NUMERIC) TO authenticated;


-- Description: Get a list of all cable segments present at a specific Junction Closure.
CREATE OR REPLACE FUNCTION public.get_segments_at_jc(p_jc_id UUID)
RETURNS TABLE (id UUID, original_cable_name TEXT, segment_order INT, fiber_count INT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        cs.id,
        oc.route_name,
        cs.segment_order,
        cs.fiber_count
    FROM public.v_cable_segments_at_jc v_cs
    JOIN public.cable_segments cs ON v_cs.id = cs.id
    JOIN public.ofc_cables oc ON cs.original_cable_id = oc.id
    WHERE v_cs.jc_node_id = (SELECT node_id FROM public.junction_closures WHERE id = p_jc_id);
$$;
GRANT EXECUTE ON FUNCTION public.get_segments_at_jc(UUID) TO authenticated;


-- FIX: This function now correctly references the segment IDs in the fiber_splices table.
-- Description: Get a list of all splices with their full JC and segment details.
CREATE OR REPLACE FUNCTION public.get_all_splices()
RETURNS TABLE (
    splice_id UUID, jc_id UUID, jc_name TEXT, jc_position_km NUMERIC,
    incoming_segment_id UUID, incoming_fiber_no INT, outgoing_segment_id UUID,
    outgoing_fiber_no INT, otdr_length_km NUMERIC, loss_db NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        s.id, s.jc_id, n.name, jc.position_km,
        s.incoming_segment_id, s.incoming_fiber_no,
        s.outgoing_segment_id, s.outgoing_fiber_no,
        s.otdr_length_km, s.loss_db
    FROM public.fiber_splices s
    JOIN public.junction_closures jc ON s.jc_id = jc.id
    JOIN public.nodes n ON jc.node_id = n.id;
$$;
GRANT EXECUTE ON FUNCTION public.get_all_splices() TO authenticated;

-- Fetches structured JSON for the splice matrix UI.
CREATE OR REPLACE FUNCTION public.get_jc_splicing_details(p_jc_id UUID)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
WITH jc_info AS (
  SELECT jc.id, n.name, jc.node_id
  FROM public.junction_closures jc
  JOIN public.nodes n ON jc.node_id = n.id
  WHERE jc.id = p_jc_id
),
segments_at_jc AS (
  SELECT
    cs.id as segment_id,
    oc.route_name || ' (Seg ' || cs.segment_order || ')' as segment_name,
    cs.fiber_count
  FROM public.cable_segments cs
  JOIN public.ofc_cables oc ON cs.original_cable_id = oc.id
  WHERE cs.start_node_id = (SELECT node_id FROM jc_info) OR cs.end_node_id = (SELECT node_id FROM jc_info)
),
fiber_universe AS (
  SELECT s.segment_id, series.i as fiber_no
  FROM segments_at_jc s, generate_series(1, s.fiber_count) series(i)
),
splice_info AS (
  SELECT
    fs.id as splice_id,
    fs.incoming_segment_id, fs.incoming_fiber_no,
    fs.outgoing_segment_id, fs.outgoing_fiber_no,
    (SELECT s_out.segment_name FROM segments_at_jc s_out WHERE s_out.segment_id = fs.outgoing_segment_id) as outgoing_segment_name,
    (SELECT s_in.segment_name FROM segments_at_jc s_in WHERE s_in.segment_id = fs.incoming_segment_id) as incoming_segment_name
  FROM public.fiber_splices fs
  WHERE fs.jc_id = p_jc_id
)
SELECT jsonb_build_object(
  'junction_closure', (SELECT to_jsonb(j) FROM jc_info j),
  'segments_at_jc', (
    SELECT jsonb_agg(
      jsonb_build_object(
        'segment_id', seg.segment_id,
        'segment_name', seg.segment_name,
        'fiber_count', seg.fiber_count,
        'fibers', (
          SELECT jsonb_agg(
            jsonb_build_object(
              'fiber_no', fu.fiber_no,
              'status', CASE
                WHEN s_in.splice_id IS NOT NULL THEN 'used_as_incoming'
                WHEN s_out.splice_id IS NOT NULL THEN 'used_as_outgoing'
                ELSE 'available'
              END,
              'splice_id', COALESCE(s_in.splice_id, s_out.splice_id),
              'connected_to_segment', COALESCE(s_in.outgoing_segment_name, s_out.incoming_segment_name),
              'connected_to_fiber', COALESCE(s_in.outgoing_fiber_no, s_out.incoming_fiber_no)
            ) ORDER BY fu.fiber_no
          )
          FROM fiber_universe fu
          LEFT JOIN splice_info s_in ON fu.segment_id = s_in.incoming_segment_id AND fu.fiber_no = s_in.incoming_fiber_no
          LEFT JOIN splice_info s_out ON fu.segment_id = s_out.outgoing_segment_id AND fu.fiber_no = s_out.outgoing_fiber_no
          WHERE fu.segment_id = seg.segment_id
        )
      )
    )
    FROM segments_at_jc seg
  )
)
FROM jc_info;
$$;
GRANT EXECUTE ON FUNCTION public.get_jc_splicing_details(UUID) TO authenticated;

-- Traces a fiber's path bi-directionally with loop detection.
CREATE OR REPLACE FUNCTION public.trace_fiber_path(p_start_cable_id UUID, p_start_fiber_no INT)
RETURNS TABLE (
    step_order BIGINT,
    element_type TEXT,
    element_id UUID,
    element_name TEXT,
    details TEXT,
    fiber_in INT,
    fiber_out INT,
    distance_km NUMERIC,
    loss_db NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_first_segment_id UUID;
BEGIN
    -- Find the very first segment of the cable route to begin the trace.
    -- This makes the trace truly bidirectional, regardless of which segment is passed in.
    SELECT cs.id INTO v_first_segment_id
    FROM public.cable_segments cs
    WHERE cs.original_cable_id = p_start_cable_id
    ORDER BY cs.segment_order
    LIMIT 1;

    IF v_first_segment_id IS NULL THEN
        -- If there are no segments, there's nothing to trace. Return an empty set.
        RETURN;
    END IF;

    RETURN QUERY
    WITH RECURSIVE path_traversal AS (
        -- Initial step: Start with the first segment of the selected cable
        SELECT
            1::BIGINT AS step,
            v_first_segment_id AS segment_id,
            p_start_fiber_no AS fiber_no,
            ARRAY[v_first_segment_id] AS path_history -- For loop detection

        UNION ALL

        -- Recursive step: Find the next connected segment by checking both sides of the splice
        SELECT
            p.step + 1,
            -- Determine the next segment_id by picking the one that is NOT the current segment
            CASE
                WHEN p.segment_id = s.incoming_segment_id THEN s.outgoing_segment_id
                ELSE s.incoming_segment_id
            END AS next_segment_id,
            -- Determine the next fiber_no accordingly
            CASE
                WHEN p.segment_id = s.incoming_segment_id THEN s.outgoing_fiber_no
                ELSE s.incoming_fiber_no
            END AS next_fiber_no,
            -- Add the new segment to our history to prevent loops
            p.path_history || CASE
                WHEN p.segment_id = s.incoming_segment_id THEN s.outgoing_segment_id
                ELSE s.incoming_segment_id
            END
        FROM
            path_traversal p
        JOIN
            public.fiber_splices s ON (p.segment_id = s.incoming_segment_id AND p.fiber_no = s.incoming_fiber_no)
                                   OR (p.segment_id = s.outgoing_segment_id AND p.fiber_no = s.outgoing_fiber_no)
        WHERE
            -- Loop prevention: stop if we've already seen the next segment
            NOT (
                CASE
                    WHEN p.segment_id = s.incoming_segment_id THEN s.outgoing_segment_id
                    ELSE s.incoming_segment_id
                END = ANY(p.path_history)
            )
            -- Stop if the path terminates (no outgoing connection)
            AND (s.outgoing_segment_id IS NOT NULL AND s.incoming_segment_id IS NOT NULL)
            -- Safety limit to prevent infinite recursion in case of data errors
            AND p.step < 50
    )
    -- Final selection and data shaping
    SELECT
        pt.step as step_order,
        'SEGMENT'::TEXT AS element_type,
        cs.id AS element_id,
        oc.route_name AS element_name,
        (sn.name || ' → ' || en.name)::TEXT AS details,
        pt.fiber_no AS fiber_in,
        pt_next.fiber_no AS fiber_out,
        cs.distance_km,
        NULL::NUMERIC AS loss_db
    FROM
        path_traversal pt
    JOIN public.cable_segments cs ON pt.segment_id = cs.id
    JOIN public.ofc_cables oc ON cs.original_cable_id = oc.id
    JOIN public.nodes sn ON cs.start_node_id = sn.id
    JOIN public.nodes en ON cs.end_node_id = en.id
    LEFT JOIN path_traversal pt_next ON pt.step + 1 = pt_next.step
    ORDER BY pt.step;
END;
$$;