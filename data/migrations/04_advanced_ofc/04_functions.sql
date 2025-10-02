-- path: data/migrations/04_advanced_ofc/04_functions.sql
-- Description: All functions for cable segmentation, splicing, and fiber path management. [CONSOLIDATED & CORRECTED]

-- =================================================================
-- Section 1: Junction Closure and Segmentation Management
-- =================================================================

-- This function is called by the frontend to add a new JC.
CREATE OR REPLACE FUNCTION public.add_junction_closure(
  p_ofc_cable_id UUID,
  p_position_km NUMERIC(10,3),
  p_node_id UUID
)
RETURNS TABLE (
  id UUID,
  node_id UUID,
  ofc_cable_id UUID,
  position_km NUMERIC(10,3),
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_jc_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.nodes WHERE nodes.id = p_node_id) THEN
    RAISE EXCEPTION 'Node with ID % does not exist', p_node_id;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.ofc_cables WHERE ofc_cables.id = p_ofc_cable_id) THEN
    RAISE EXCEPTION 'Cable with ID % does not exist', p_ofc_cable_id;
  END IF;

  INSERT INTO public.junction_closures (node_id, ofc_cable_id, position_km)
  VALUES (p_node_id, p_ofc_cable_id, p_position_km)
  RETURNING junction_closures.id INTO v_jc_id;

  RETURN QUERY
  SELECT jc.id, jc.node_id, jc.ofc_cable_id, jc.position_km, jc.created_at
  FROM public.junction_closures jc
  WHERE jc.id = v_jc_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.add_junction_closure(UUID, NUMERIC, UUID) TO authenticated;

-- This function is called by a trigger to non-destructively recalculate segments.
CREATE OR REPLACE FUNCTION public.recalculate_segments_for_cable(p_cable_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cable RECORD;
BEGIN
  SELECT * INTO v_cable FROM public.ofc_cables WHERE id = p_cable_id;
  IF NOT FOUND THEN
    RAISE WARNING 'Cable not found for segmentation: %', p_cable_id;
    RETURN;
  END IF;

  DELETE FROM public.cable_segments WHERE original_cable_id = p_cable_id;

  CREATE TEMP TABLE route_points AS
  SELECT v_cable.sn_id AS point_id, 'node' AS point_type, 0.0 AS position_km
  UNION ALL
  SELECT jc.node_id, 'jc', jc.position_km
  FROM public.junction_closures jc
  WHERE jc.ofc_cable_id = p_cable_id
  UNION ALL
  SELECT v_cable.en_id, 'node', v_cable.current_rkm;

  INSERT INTO public.cable_segments (
    original_cable_id, segment_order,
    start_node_id, start_node_type,
    end_node_id, end_node_type,
    distance_km, fiber_count
  )
  SELECT
    p_cable_id,
    ROW_NUMBER() OVER (ORDER BY p_start.position_km),
    p_start.point_id, p_start.point_type,
    p_end.point_id, p_end.point_type,
    p_end.position_km - p_start.position_km,
    v_cable.capacity
  FROM route_points p_start
  JOIN LATERAL (
    SELECT * FROM route_points p2
    WHERE p2.position_km > p_start.position_km
    ORDER BY p2.position_km ASC
    LIMIT 1
  ) p_end ON true;

  DROP TABLE route_points;
END;
$$;

-- This is the trigger function that orchestrates segmentation.
CREATE OR REPLACE FUNCTION public.trigger_manage_cable_segments()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    PERFORM public.recalculate_segments_for_cable(NEW.ofc_cable_id);
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    PERFORM public.recalculate_segments_for_cable(OLD.ofc_cable_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- =================================================================
-- Section 2: Fiber Splice and Path Management
-- =================================================================

-- This trigger function updates ofc_connections after a splice change.
CREATE OR REPLACE FUNCTION public.update_ofc_connections_from_splice()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_splice RECORD;
    v_start_fiber INT;
    v_end_fiber INT;
    path_segments RECORD;
BEGIN
    IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE') THEN
        v_splice := NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        v_splice := OLD;
    END IF;

    -- On DELETE, find all related segments and reset them before exiting.
    IF (TG_OP = 'DELETE') THEN
        FOR path_segments IN (
            WITH RECURSIVE full_path AS (
                (SELECT OLD.incoming_segment_id as segment_id, OLD.incoming_fiber_no as fiber_no, ARRAY[OLD.id] as visited
                UNION ALL
                SELECT
                    CASE WHEN p.segment_id = s.incoming_segment_id THEN s.outgoing_segment_id ELSE s.incoming_segment_id END,
                    CASE WHEN p.segment_id = s.incoming_segment_id THEN s.outgoing_fiber_no ELSE s.incoming_fiber_no END,
                    p.visited || s.id
                FROM full_path p JOIN fiber_splices s ON ((p.segment_id = s.incoming_segment_id AND p.fiber_no = s.incoming_fiber_no) OR (p.segment_id = s.outgoing_segment_id AND p.fiber_no = s.outgoing_fiber_no)) AND s.id <> OLD.id
                WHERE NOT (s.id = ANY(p.visited)))
                UNION ALL
                (SELECT OLD.outgoing_segment_id, OLD.outgoing_fiber_no, ARRAY[OLD.id]
                UNION ALL
                SELECT
                    CASE WHEN p.segment_id = s.outgoing_segment_id THEN s.incoming_segment_id ELSE s.outgoing_segment_id END,
                    CASE WHEN p.segment_id = s.outgoing_segment_id THEN s.incoming_fiber_no ELSE s.outgoing_fiber_no END,
                    p.visited || s.id
                FROM full_path p JOIN fiber_splices s ON ((p.segment_id = s.incoming_segment_id AND p.fiber_no = s.incoming_fiber_no) OR (p.segment_id = s.outgoing_segment_id AND p.fiber_no = s.outgoing_fiber_no)) AND s.id <> OLD.id
                WHERE NOT (s.id = ANY(p.visited)))
            )
            SELECT cs.original_cable_id, fp.fiber_no FROM full_path fp JOIN cable_segments cs ON fp.segment_id = cs.id
        )
        LOOP
            UPDATE public.ofc_connections
            SET updated_fiber_no_sn = fiber_no_sn, updated_fiber_no_en = fiber_no_en
            WHERE ofc_id = path_segments.original_cable_id AND fiber_no_sn = path_segments.fiber_no;
        END LOOP;
        RETURN OLD;
    END IF;

    -- For INSERT/UPDATE, find the ultimate start and end of the path
    SELECT fiber_no INTO v_start_fiber FROM (
        WITH RECURSIVE trace AS (
            SELECT 1 as step, v_splice.incoming_segment_id as segment_id, v_splice.incoming_fiber_no as fiber_no, ARRAY[v_splice.id] as visited
            UNION ALL
            SELECT p.step + 1,
                   CASE WHEN p.segment_id = s.outgoing_segment_id THEN s.incoming_segment_id ELSE s.outgoing_segment_id END,
                   CASE WHEN p.segment_id = s.outgoing_segment_id THEN s.incoming_fiber_no ELSE s.outgoing_fiber_no END,
                   p.visited || s.id
            FROM trace p JOIN fiber_splices s ON (p.segment_id = s.incoming_segment_id AND p.fiber_no = s.incoming_fiber_no) OR (p.segment_id = s.outgoing_segment_id AND p.fiber_no = s.outgoing_fiber_no)
            WHERE NOT (s.id = ANY(p.visited))
        ) SELECT fiber_no FROM trace ORDER BY step DESC LIMIT 1
    ) AS backwards;
    
    IF v_splice.outgoing_segment_id IS NULL THEN
        v_end_fiber := 0;
    ELSE
        SELECT fiber_no INTO v_end_fiber FROM (
            WITH RECURSIVE trace AS (
                SELECT 1 as step, v_splice.outgoing_segment_id as segment_id, v_splice.outgoing_fiber_no as fiber_no, ARRAY[v_splice.id] as visited
                UNION ALL
                SELECT p.step + 1,
                       CASE WHEN p.segment_id = s.incoming_segment_id THEN s.outgoing_segment_id ELSE s.incoming_segment_id END,
                       CASE WHEN p.segment_id = s.incoming_segment_id THEN s.outgoing_fiber_no ELSE s.incoming_fiber_no END,
                       p.visited || s.id
                FROM trace p JOIN fiber_splices s ON (p.segment_id = s.incoming_segment_id AND p.fiber_no = s.incoming_fiber_no) OR (p.segment_id = s.outgoing_segment_id AND p.fiber_no = s.outgoing_fiber_no)
                WHERE NOT (s.id = ANY(p.visited))
            ) SELECT fiber_no FROM trace ORDER BY step DESC LIMIT 1
        ) AS forwards;
        IF NOT FOUND THEN v_end_fiber := 0; END IF;
    END IF;

    -- Update all connections in the newly formed logical path
    FOR path_segments IN (
        WITH RECURSIVE full_path AS (
            (SELECT v_splice.incoming_segment_id as segment_id, v_splice.incoming_fiber_no as fiber_no, ARRAY[v_splice.id] as visited
            UNION ALL
            SELECT
                CASE WHEN p.segment_id = s.incoming_segment_id THEN s.outgoing_segment_id ELSE s.incoming_segment_id END,
                CASE WHEN p.segment_id = s.incoming_segment_id THEN s.outgoing_fiber_no ELSE s.incoming_fiber_no END,
                p.visited || s.id
            FROM full_path p JOIN fiber_splices s ON ((p.segment_id = s.incoming_segment_id AND p.fiber_no = s.incoming_fiber_no) OR (p.segment_id = s.outgoing_segment_id AND p.fiber_no = s.outgoing_fiber_no))
            WHERE NOT (s.id = ANY(p.visited)))
        )
        SELECT cs.original_cable_id, fp.fiber_no FROM full_path fp JOIN cable_segments cs ON fp.segment_id = cs.id
    )
    LOOP
        UPDATE public.ofc_connections
        SET updated_fiber_no_sn = v_start_fiber, updated_fiber_no_en = v_end_fiber
        WHERE ofc_id = path_segments.original_cable_id AND fiber_no_sn = path_segments.fiber_no;
    END LOOP;

    RETURN NEW;
END;
$$;

-- Description: RPC function to handle creating, deleting, and updating splices.
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

-- Fetches structured JSON for the splice matrix UI, showing all connections at a physical node.
CREATE OR REPLACE FUNCTION public.get_jc_splicing_details(p_jc_id UUID)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
WITH jc_info AS (
  SELECT jc.id, n.name, jc.node_id FROM public.junction_closures jc JOIN public.nodes n ON jc.node_id = n.id WHERE jc.id = p_jc_id
), all_jcs_at_node AS (
  SELECT id FROM public.junction_closures WHERE node_id = (SELECT node_id FROM jc_info)
), segments_at_jc AS (
  SELECT cs.id as segment_id, oc.route_name || ' (Seg ' || cs.segment_order || ')' as segment_name, cs.fiber_count
  FROM public.cable_segments cs JOIN public.ofc_cables oc ON cs.original_cable_id = oc.id
  WHERE cs.start_node_id = (SELECT node_id FROM jc_info) OR cs.end_node_id = (SELECT node_id FROM jc_info)
), fiber_universe AS (
  SELECT s.segment_id, series.i as fiber_no FROM segments_at_jc s, generate_series(1, s.fiber_count) series(i)
), splice_info AS (
  SELECT
    fs.id as splice_id, fs.jc_id, fs.incoming_segment_id, fs.incoming_fiber_no, fs.outgoing_segment_id, fs.outgoing_fiber_no,
    (SELECT oc.route_name || ' (Seg ' || cs_out.segment_order || ')' FROM cable_segments cs_out JOIN public.ofc_cables oc ON cs_out.original_cable_id = oc.id WHERE cs_out.id = fs.outgoing_segment_id) as outgoing_segment_name,
    (SELECT oc.route_name || ' (Seg ' || cs_in.segment_order || ')' FROM cable_segments cs_in JOIN public.ofc_cables oc ON cs_in.original_cable_id = oc.id WHERE cs_in.id = fs.incoming_segment_id) as incoming_segment_name
  FROM public.fiber_splices fs WHERE fs.jc_id IN (SELECT id FROM all_jcs_at_node)
)
SELECT jsonb_build_object(
  'junction_closure', (SELECT to_jsonb(j) FROM jc_info j),
  'segments_at_jc', (
    SELECT jsonb_agg(jsonb_build_object(
      'segment_id', seg.segment_id, 'segment_name', seg.segment_name, 'fiber_count', seg.fiber_count,
      'fibers', (
        SELECT jsonb_agg(jsonb_build_object(
          'fiber_no', fu.fiber_no,
          'status', CASE WHEN s_in.splice_id IS NOT NULL THEN 'used_as_incoming' WHEN s_out.splice_id IS NOT NULL THEN 'used_as_outgoing' ELSE 'available' END,
          'splice_id', COALESCE(s_in.splice_id, s_out.splice_id),
          'connected_to_segment', COALESCE(s_in.outgoing_segment_name, s_out.incoming_segment_name),
          'connected_to_fiber', COALESCE(s_in.outgoing_fiber_no, s_out.incoming_fiber_no)
        ) ORDER BY fu.fiber_no)
        FROM fiber_universe fu
        LEFT JOIN splice_info s_in ON fu.segment_id = s_in.incoming_segment_id AND fu.fiber_no = s_in.incoming_fiber_no
        LEFT JOIN splice_info s_out ON fu.segment_id = s_out.outgoing_segment_id AND fu.fiber_no = s_out.outgoing_fiber_no
        WHERE fu.segment_id = seg.segment_id
      )
    ))
    FROM segments_at_jc seg
  )
)
FROM jc_info;
$$;
GRANT EXECUTE ON FUNCTION public.get_jc_splicing_details(UUID) TO authenticated;

-- **THE FIX: Final, correct, robust bi-directional trace function.**
CREATE OR REPLACE FUNCTION public.trace_fiber_path(p_start_segment_id UUID, p_start_fiber_no INT)
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
BEGIN
    RETURN QUERY
    WITH RECURSIVE
    trace_forward AS (
        SELECT
            0::bigint as step,
            p_start_segment_id as segment_id,
            p_start_fiber_no as fiber_no,
            ARRAY[]::uuid[] as visited_splices
        UNION ALL
        SELECT
            p.step + 1,
            CASE WHEN p.segment_id = s.incoming_segment_id THEN s.outgoing_segment_id ELSE s.incoming_segment_id END,
            CASE WHEN p.segment_id = s.incoming_segment_id THEN s.outgoing_fiber_no ELSE s.incoming_fiber_no END,
            p.visited_splices || s.id
        FROM trace_forward p
        JOIN public.fiber_splices s ON
            (p.segment_id = s.incoming_segment_id AND p.fiber_no = s.incoming_fiber_no) OR
            (p.segment_id = s.outgoing_segment_id AND p.fiber_no = s.outgoing_fiber_no)
        WHERE NOT (s.id = ANY(p.visited_splices)) AND p.step < 50
    ),
    trace_backward AS (
        SELECT
            0::bigint as step,
            p_start_segment_id as segment_id,
            p_start_fiber_no as fiber_no,
            ARRAY[]::uuid[] as visited_splices
        UNION ALL
        SELECT
            p.step - 1,
            CASE WHEN p.segment_id = s.outgoing_segment_id THEN s.incoming_segment_id ELSE s.outgoing_segment_id END,
            CASE WHEN p.segment_id = s.outgoing_segment_id THEN s.incoming_fiber_no ELSE s.outgoing_fiber_no END,
            p.visited_splices || s.id
        FROM trace_backward p
        JOIN public.fiber_splices s ON
            (p.segment_id = s.incoming_segment_id AND p.fiber_no = s.incoming_fiber_no) OR
            (p.segment_id = s.outgoing_segment_id AND p.fiber_no = s.outgoing_fiber_no)
        WHERE NOT (s.id = ANY(p.visited_splices)) AND p.step > -50
    ),
    full_path AS (
        SELECT step, segment_id, fiber_no FROM trace_forward
        UNION ALL
        SELECT step, segment_id, fiber_no FROM trace_backward WHERE step < 0
    )
    SELECT
        ROW_NUMBER() OVER (ORDER BY fp.step) AS step_order,
        'SEGMENT'::TEXT AS element_type,
        cs.id AS element_id,
        oc.route_name AS element_name,
        (sn.name || ' → ' || en.name)::TEXT AS details,
        fp.fiber_no AS fiber_in,
        LEAD(fp.fiber_no) OVER (ORDER BY fp.step) AS fiber_out,
        cs.distance_km,
        NULL::NUMERIC AS loss_db
    FROM
        full_path fp
    JOIN public.cable_segments cs ON fp.segment_id = cs.id
    JOIN public.ofc_cables oc ON cs.original_cable_id = cs.id
    JOIN public.nodes sn ON cs.start_node_id = sn.id
    JOIN public.nodes en ON cs.end_node_id = en.id
    ORDER BY fp.step;
END;
$$;

GRANT EXECUTE ON FUNCTION public.trace_path(UUID, UUID, INT, INT) TO authenticated;

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

