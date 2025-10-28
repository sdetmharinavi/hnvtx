-- path: data/migrations/04_advanced_ofc/08_upsert_route_topology.sql
-- Description: Creates a robust, transactional function to upsert an entire route topology from a JSON payload.

CREATE OR REPLACE FUNCTION public.upsert_route_topology_from_excel(
  p_route_id UUID,
  p_junction_closures JSONB,
  p_cable_segments JSONB,
  p_fiber_splices JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_jc_id UUID;
  v_seg_id UUID;
  v_splice_id UUID;
  all_jc_ids UUID[];
  all_segment_ids UUID[];
  all_splice_ids UUID[];
  duplicate_order INT;
BEGIN
  -- Use a transaction to ensure all or nothing is applied
  BEGIN
    -- 1. Load incoming IDs into arrays for validation and cleanup
    SELECT array_agg(id) INTO all_jc_ids FROM jsonb_to_recordset(p_junction_closures) AS x(id UUID);
    SELECT array_agg(id) INTO all_segment_ids FROM jsonb_to_recordset(p_cable_segments) AS x(id UUID);
    SELECT array_agg(id) INTO all_splice_ids FROM jsonb_to_recordset(p_fiber_splices) AS x(id UUID);

    -- 2. Pre-validation Checks
    -- THE FIX: Check for duplicate segment_order within the payload itself.
    SELECT segment_order INTO duplicate_order
    FROM jsonb_to_recordset(p_cable_segments) AS x(segment_order INT)
    GROUP BY segment_order
    HAVING COUNT(*) > 1
    LIMIT 1;
    IF FOUND THEN
      RAISE EXCEPTION 'Import failed: The "Cable Segments" sheet contains a duplicate segment_order: %. Each segment must have a unique order number.', duplicate_order;
    END IF;

    -- Check if all splices reference valid segments within the payload
    SELECT id INTO v_splice_id FROM jsonb_to_recordset(p_fiber_splices) AS x(id UUID, incoming_segment_id UUID)
    WHERE incoming_segment_id IS NOT NULL AND NOT (incoming_segment_id = ANY(all_segment_ids));
    IF FOUND THEN
      RAISE EXCEPTION 'Import failed: A fiber splice references an incoming_segment_id that does not exist in the "Cable Segments" sheet. Invalid Segment ID referenced by Splice ID: %', v_splice_id;
    END IF;

    -- Check if all splices reference valid JCs within the payload
    SELECT id INTO v_splice_id FROM jsonb_to_recordset(p_fiber_splices) AS x(id UUID, jc_id UUID)
    WHERE jc_id IS NOT NULL AND NOT (jc_id = ANY(all_jc_ids));
    IF FOUND THEN
      RAISE EXCEPTION 'Import failed: A fiber splice references a jc_id that does not exist in the "Junction Closures" sheet. Invalid JC ID referenced by Splice ID: %', v_splice_id;
    END IF;

    -- 3. Perform Deletions: Remove items associated with the route that are NOT in the new payload
    DELETE FROM public.fiber_splices WHERE public.fiber_splices.jc_id IN (SELECT id FROM public.junction_closures WHERE ofc_cable_id = p_route_id) AND NOT (public.fiber_splices.id = ANY(all_splice_ids));
    DELETE FROM public.cable_segments WHERE public.cable_segments.original_cable_id = p_route_id AND NOT (public.cable_segments.id = ANY(all_segment_ids));
    DELETE FROM public.junction_closures WHERE public.junction_closures.ofc_cable_id = p_route_id AND NOT (public.junction_closures.id = ANY(all_jc_ids));

    -- 4. Upsert Junction Closures
    INSERT INTO public.junction_closures (id, ofc_cable_id, node_id, position_km)
    SELECT id, p_route_id, node_id, position_km FROM jsonb_to_recordset(p_junction_closures) AS x(id UUID, node_id UUID, position_km NUMERIC)
    ON CONFLICT (id) DO UPDATE SET
      ofc_cable_id = EXCLUDED.ofc_cable_id,
      node_id = EXCLUDED.node_id,
      position_km = EXCLUDED.position_km;

    -- 5. Upsert Cable Segments
    INSERT INTO public.cable_segments (id, original_cable_id, segment_order, start_node_id, end_node_id, start_node_type, end_node_type, distance_km, fiber_count)
    SELECT id, p_route_id, segment_order, start_node_id, end_node_id, start_node_type, end_node_type, distance_km, fiber_count FROM jsonb_to_recordset(p_cable_segments) AS x(id UUID, segment_order INT, start_node_id UUID, end_node_id UUID, start_node_type TEXT, end_node_type TEXT, distance_km NUMERIC, fiber_count INT)
    ON CONFLICT (original_cable_id, segment_order) DO UPDATE SET
      id = EXCLUDED.id, -- Also update the ID to handle the case of duplicate segment_order with different IDs
      start_node_id = EXCLUDED.start_node_id,
      end_node_id = EXCLUDED.end_node_id,
      start_node_type = EXCLUDED.start_node_type,
      end_node_type = EXCLUDED.end_node_type,
      distance_km = EXCLUDED.distance_km,
      fiber_count = EXCLUDED.fiber_count,
      updated_at = NOW();

    -- 6. Upsert Fiber Splices
    INSERT INTO public.fiber_splices (id, jc_id, incoming_segment_id, incoming_fiber_no, outgoing_segment_id, outgoing_fiber_no, splice_type_id, loss_db)
    SELECT id, jc_id, incoming_segment_id, incoming_fiber_no, outgoing_segment_id, outgoing_fiber_no, splice_type_id, loss_db FROM jsonb_to_recordset(p_fiber_splices) AS x(id UUID, jc_id UUID, incoming_segment_id UUID, incoming_fiber_no INT, outgoing_segment_id UUID, outgoing_fiber_no INT, splice_type_id UUID, loss_db NUMERIC)
    ON CONFLICT (id) DO UPDATE SET
      jc_id = EXCLUDED.jc_id,
      incoming_segment_id = EXCLUDED.incoming_segment_id,
      incoming_fiber_no = EXCLUDED.incoming_fiber_no,
      outgoing_segment_id = EXCLUDED.outgoing_segment_id,
      outgoing_fiber_no = EXCLUDED.outgoing_fiber_no,
      splice_type_id = EXCLUDED.splice_type_id,
      loss_db = EXCLUDED.loss_db,
      updated_at = NOW();

  EXCEPTION
    WHEN OTHERS THEN
      RAISE;
  END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_route_topology_from_excel(UUID, JSONB, JSONB, JSONB) TO authenticated;