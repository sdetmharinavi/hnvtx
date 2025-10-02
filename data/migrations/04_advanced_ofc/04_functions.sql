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