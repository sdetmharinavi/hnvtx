-- path: data/migrations/04_advanced_ofc/04_functions.sql
-- Description: Database functions for cable segmentation and fiber path management [FINAL CORRECTED VERSION]

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

-- **THE FIX: Corrected and robust trigger function to update ofc_connections.**
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
BEGIN
    IF (TG_OP = 'INSERT') THEN
        v_splice := NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        v_splice := NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        v_splice := OLD;
    END IF;

    -- Trace backwards to find the ultimate start fiber
    WITH RECURSIVE trace_backward AS (
        SELECT 1 as step, v_splice.incoming_segment_id as segment_id, v_splice.incoming_fiber_no as fiber_no, ARRAY[v_splice.id] as visited_splices
        UNION ALL
        SELECT
            p.step + 1,
            CASE WHEN p.segment_id = s.outgoing_segment_id THEN s.incoming_segment_id ELSE s.outgoing_segment_id END,
            CASE WHEN p.segment_id = s.outgoing_segment_id THEN s.incoming_fiber_no ELSE s.outgoing_fiber_no END,
            p.visited_splices || s.id
        FROM trace_backward p
        JOIN fiber_splices s ON (p.segment_id = s.incoming_segment_id AND p.fiber_no = s.incoming_fiber_no) OR (p.segment_id = s.outgoing_segment_id AND p.fiber_no = s.outgoing_fiber_no)
        WHERE NOT (s.id = ANY(p.visited_splices))
    )
    SELECT fiber_no INTO v_start_fiber FROM trace_backward ORDER BY step DESC LIMIT 1;
    
    -- Trace forwards to find the ultimate end fiber
    IF v_splice.outgoing_segment_id IS NULL THEN
        v_end_fiber := 0; -- A terminated fiber has no outgoing number
    ELSE
        WITH RECURSIVE trace_forward AS (
            SELECT 1 as step, v_splice.outgoing_segment_id as segment_id, v_splice.outgoing_fiber_no as fiber_no, ARRAY[v_splice.id] as visited_splices
            UNION ALL
            SELECT
                p.step + 1,
                CASE WHEN p.segment_id = s.incoming_segment_id THEN s.outgoing_segment_id ELSE s.incoming_segment_id END,
                CASE WHEN p.segment_id = s.incoming_segment_id THEN s.outgoing_fiber_no ELSE s.incoming_fiber_no END,
                p.visited_splices || s.id
            FROM trace_forward p
            JOIN fiber_splices s ON (p.segment_id = s.incoming_segment_id AND p.fiber_no = s.incoming_fiber_no) OR (p.segment_id = s.outgoing_segment_id AND p.fiber_no = s.outgoing_fiber_no)
            WHERE NOT (s.id = ANY(p.visited_splices))
        )
        SELECT fiber_no INTO v_end_fiber FROM trace_forward ORDER BY step DESC LIMIT 1;
        IF NOT FOUND THEN v_end_fiber := 0; END IF;
    END IF;

    -- Update all connections that are part of this logical path
    WITH RECURSIVE full_path AS (
        (SELECT v_splice.incoming_segment_id as segment_id, v_splice.incoming_fiber_no as fiber_no, ARRAY[v_splice.id] as visited_splices
        UNION ALL
        SELECT
            CASE WHEN p.segment_id = s.incoming_segment_id THEN s.outgoing_segment_id ELSE s.incoming_segment_id END,
            CASE WHEN p.segment_id = s.incoming_segment_id THEN s.outgoing_fiber_no ELSE s.incoming_fiber_no END,
            p.visited_splices || s.id
        FROM full_path p JOIN fiber_splices s ON (p.segment_id = s.incoming_segment_id AND p.fiber_no = s.incoming_fiber_no) OR (p.segment_id = s.outgoing_segment_id AND p.fiber_no = s.outgoing_fiber_no)
        WHERE NOT (s.id = ANY(p.visited_splices)))
    )
    UPDATE public.ofc_connections
    SET
        updated_fiber_no_sn = v_start_fiber,
        updated_fiber_no_en = v_end_fiber
    WHERE (ofc_id, fiber_no_sn) IN (
        SELECT cs.original_cable_id, fp.fiber_no
        FROM full_path fp JOIN cable_segments cs ON fp.segment_id = cs.id
    );

    IF (TG_OP = 'DELETE') THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;