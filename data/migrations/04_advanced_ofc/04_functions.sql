-- Path: migrations/04_advanced_ofc/06_functions.sql
-- Description: Database functions for cable segmentation and fiber path management

-- Function to add a junction closure
CREATE OR REPLACE FUNCTION public.add_junction_closure(
  p_ofc_cable_id UUID,         -- the fiber cable this JC belongs to
  p_position_km DECIMAL(10,3), -- the position along the cable
  p_node_id UUID               -- existing node ID to reference (not create new node)
)
RETURNS TABLE (                -- what the function will return
  id UUID,
  node_id UUID,
  ofc_cable_id UUID,
  position_km DECIMAL(10,3),
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_jc_id UUID;
BEGIN
  -- Validate that the node exists
  IF NOT EXISTS (SELECT 1 FROM nodes WHERE nodes.id = p_node_id) THEN
    RAISE EXCEPTION 'Node with ID % does not exist', p_node_id;
  END IF;

  -- Validate that the cable exists
  IF NOT EXISTS (SELECT 1 FROM ofc_cables WHERE ofc_cables.id = p_ofc_cable_id) THEN
    RAISE EXCEPTION 'Cable with ID % does not exist', p_ofc_cable_id;
  END IF;

  -- Create the junction closure record (references existing node)
  INSERT INTO junction_closures (
    node_id,
    ofc_cable_id,
    position_km,
    created_at
  ) VALUES (
    p_node_id,
    p_ofc_cable_id,
    p_position_km,
    NOW()
  )
  RETURNING junction_closures.id INTO v_jc_id;

  -- Return the created junction closure
  RETURN QUERY
  SELECT
    created_jc.id,
    created_jc.node_id,
    created_jc.ofc_cable_id,
    created_jc.position_km,
    created_jc.created_at
  FROM junction_closures created_jc
  WHERE created_jc.id = v_jc_id;
END;
$$;

-- Function to create cable segments when a JC is added
CREATE OR REPLACE FUNCTION public.create_cable_segments_on_jc_add(
  p_jc_id UUID,
  p_ofc_cable_id UUID
)
RETURNS TABLE (
  segment_id UUID,
  segment_order INTEGER,
  start_node_id UUID,
  end_node_id UUID,
  distance_km DECIMAL(10,3),
  fiber_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_jc_record RECORD;
  v_cable_record RECORD;
  v_existing_segments INTEGER;
  v_segment_order INTEGER := 1;
  v_start_distance DECIMAL(10,3) := 0;
  v_end_distance DECIMAL(10,3);
  v_jc_count INTEGER;
BEGIN
  -- Debug logging
  RAISE NOTICE 'Creating cable segments for JC: % on cable: %', p_jc_id, p_ofc_cable_id;

  -- Get JC information
  SELECT jc_info.* INTO v_jc_record
  FROM junction_closures jc_info
  WHERE jc_info.id = p_jc_id;

  -- Get cable information
  SELECT oc.* INTO v_cable_record
  FROM ofc_cables oc
  WHERE oc.id = p_ofc_cable_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'JC or cable not found. JC: %, Cable: %', p_jc_id, p_ofc_cable_id;
  END IF;

  RAISE NOTICE 'Found JC: % at position %, Cable: % from % to %',
    v_jc_record.id, v_jc_record.position_km,
    v_cable_record.id, v_cable_record.sn_id, v_cable_record.en_id;

  -- Check if segments already exist for this cable
  SELECT COUNT(*) INTO v_existing_segments
  FROM cable_segments cs
  WHERE cs.original_cable_id = p_ofc_cable_id;

  -- If segments exist, we need to handle this differently
  -- For now, let's allow adding more JCs but we need to rebuild segments
  IF v_existing_segments > 0 THEN
    -- Delete existing segments and recreate them
    DELETE FROM cable_segments WHERE original_cable_id = p_ofc_cable_id;
    RAISE NOTICE 'Deleted % existing segments, recreating all segments', v_existing_segments;
  END IF;

  RAISE NOTICE 'Creating segments for cable with % JCs', v_existing_segments;

  -- Get all junction closures for this cable, ordered by position
  -- Also include the cable start and end nodes
  CREATE TEMP TABLE temp_jc_positions AS
  SELECT
    'start'::TEXT as node_type,
    v_cable_record.sn_id as node_id,
    0::DECIMAL(10,3) as position_km
  UNION ALL
  SELECT
    'jc'::TEXT as node_type,
    cable_jc.node_id as node_id,  -- Fixed: use node_id instead of id
    cable_jc.position_km
  FROM junction_closures cable_jc
  WHERE cable_jc.ofc_cable_id = p_ofc_cable_id
  UNION ALL
  SELECT
    'end'::TEXT as node_type,
    v_cable_record.en_id as node_id,
    v_cable_record.current_rkm as position_km;

  -- Debug: Check what nodes we have
  RAISE NOTICE 'Nodes for cable %: %',
    p_ofc_cable_id,
    (SELECT string_agg(node_type || ':' || node_id::text || '@' || position_km::text, ', ' ORDER BY position_km)
     FROM temp_jc_positions);

  -- Create segments between consecutive nodes
  INSERT INTO cable_segments (
    original_cable_id,
    segment_order,
    start_node_id,
    end_node_id,
    start_node_type,
    end_node_type,
    distance_km,
    fiber_count,
    created_at
  )
  SELECT
    p_ofc_cable_id,
    ROW_NUMBER() OVER (ORDER BY t.position_km),
    prev_node.node_id,
    t.node_id,
    CASE prev_node.node_type
      WHEN 'start' THEN 'node'
      WHEN 'jc' THEN 'jc'
      ELSE 'node'
    END,
    CASE t.node_type
      WHEN 'end' THEN 'node'
      WHEN 'jc' THEN 'jc'
      ELSE 'node'
    END,
    t.position_km - prev_node.position_km,
    v_cable_record.capacity,
    NOW()
  FROM temp_jc_positions t
  JOIN LATERAL (
    SELECT t2.node_id, t2.node_type, t2.position_km
    FROM temp_jc_positions t2
    WHERE t2.position_km < t.position_km
    ORDER BY t2.position_km DESC
    LIMIT 1
  ) prev_node ON true
  WHERE t.node_type != 'start';

  -- Clean up temp table
  DROP TABLE temp_jc_positions;

  -- Return the created segments
  RETURN QUERY
  SELECT
    cs.id,
    cs.segment_order,
    cs.start_node_id,
    cs.end_node_id,
    cs.distance_km,
    cs.fiber_count
  FROM cable_segments cs
  WHERE cs.original_cable_id = p_ofc_cable_id
  ORDER BY cs.segment_order;

  -- Log the number of segments created
  GET DIAGNOSTICS v_segment_order = ROW_COUNT;
  RAISE NOTICE 'Created % segments for cable %', v_segment_order, p_ofc_cable_id;
END;
$$;

-- Function to create initial fiber connections for a cable segment
CREATE OR REPLACE FUNCTION public.create_initial_fiber_connections(
  p_segment_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_segment_record RECORD;
  v_fiber_count INTEGER;
  v_connection_count INTEGER := 0;
  v_fiber_no INTEGER;
BEGIN
  -- Get segment information
  SELECT cs.* INTO v_segment_record
  FROM cable_segments cs
  WHERE cs.id = p_segment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Segment not found';
  END IF;

  v_fiber_count := v_segment_record.fiber_count;

  -- Create fiber connections for each fiber in the segment
  FOR v_fiber_no IN 1..v_fiber_count LOOP
    INSERT INTO ofc_connections (
      ofc_id,
      fiber_no_sn,
      fiber_no_en,
      connection_category,
      connection_type,
      created_at
    ) VALUES (
      v_segment_record.original_cable_id,
      v_fiber_no,
      v_fiber_no,
      'OFC_JOINT_TYPES',
      'straight',
      NOW()
    );

    v_connection_count := v_connection_count + 1;
  END LOOP;

  RETURN v_connection_count;
END;
$$;

-- Function to get fiber path from start to end node
CREATE OR REPLACE FUNCTION public.get_fiber_path(
  p_start_node_id UUID,
  p_end_node_id UUID,
  p_fiber_number INTEGER
)
RETURNS TABLE (
  segment_id UUID,
  segment_order INTEGER,
  start_node_id UUID,
  end_node_id UUID,
  fiber_no_sn INTEGER,
  fiber_no_en INTEGER,
  connection_type TEXT,
  distance_km DECIMAL(10,3)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE fiber_path AS (
    -- Start with segments connected to the start node
    SELECT
      cs.id as segment_id,
      cs.segment_order,
      cs.start_node_id,
      cs.end_node_id,
      oc.fiber_no_sn,
      oc.fiber_no_en,
      oc.connection_type,
      cs.distance_km,
      1 as path_level
    FROM cable_segments cs
    JOIN ofc_connections oc ON oc.ofc_id = cs.original_cable_id
    WHERE cs.start_node_id = p_start_node_id
      AND oc.fiber_no_sn = p_fiber_number

    UNION ALL

    -- Recursively find next segments through JCs
    SELECT
      cs2.id as segment_id,
      cs2.segment_order,
      cs2.start_node_id,
      cs2.end_node_id,
      oc2.fiber_no_sn,
      oc2.fiber_no_en,
      oc2.connection_type,
      cs2.distance_km,
      fp.path_level + 1
    FROM fiber_path fp
    JOIN cable_segments cs ON cs.id = fp.segment_id
    JOIN junction_closures fiber_jc ON fiber_jc.node_id = cs.end_node_id  -- Fixed: use node_id instead of id
    JOIN cable_segments cs2 ON cs2.start_node_id = fiber_jc.node_id
    JOIN ofc_connections oc2 ON oc2.ofc_id = cs2.original_cable_id
    WHERE cs.end_node_id = fiber_jc.node_id  -- Fixed: use node_id instead of id
      AND oc2.fiber_no_sn = fp.fiber_no_en
      AND fp.path_level < 10 -- Prevent infinite recursion
  )
  SELECT
    fp.segment_id,
    fp.segment_order,
    fp.start_node_id,
    fp.end_node_id,
    fp.fiber_no_sn,
    fp.fiber_no_en,
    fp.connection_type,
    fp.distance_km
  FROM fiber_path fp
  WHERE fp.end_node_id = p_end_node_id
  ORDER BY fp.path_level;
END;
$$;

-- Function to apply straight joint splicing
CREATE OR REPLACE FUNCTION public.apply_straight_joint_splicing(
  p_jc_id UUID,
  p_incoming_segment_id UUID,
  p_outgoing_segment_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_incoming_segment RECORD;
  v_outgoing_segment RECORD;
  v_fiber_count INTEGER;
  v_updated_count INTEGER := 0;
  v_fiber_no INTEGER;
BEGIN
  -- Get segment information
  SELECT cs.* INTO v_incoming_segment
  FROM cable_segments cs
  WHERE cs.id = p_incoming_segment_id;

  SELECT cs.* INTO v_outgoing_segment
  FROM cable_segments cs
  WHERE cs.id = p_outgoing_segment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Segments not found';
  END IF;

  -- Ensure both segments belong to the same cable
  IF v_incoming_segment.original_cable_id != v_outgoing_segment.original_cable_id THEN
    RAISE EXCEPTION 'Segments must belong to the same cable';
  END IF;

  v_fiber_count := v_incoming_segment.fiber_count;

  -- For straight joint, fiber numbers remain the same
  FOR v_fiber_no IN 1..v_fiber_count LOOP
    -- Update or create fiber splice
    INSERT INTO fiber_splices (
      jc_id,
      incoming_cable_id,
      incoming_fiber_no,
      outgoing_cable_id,
      outgoing_fiber_no,
      splice_type,
      status,
      created_at
    ) VALUES (
      p_jc_id,
      v_incoming_segment.original_cable_id,
      v_fiber_no,
      v_outgoing_segment.original_cable_id,
      v_fiber_no,
      'pass_through',
      'active',
      NOW()
    )
    ON CONFLICT (jc_id, incoming_cable_id, incoming_fiber_no)
    DO UPDATE SET
      outgoing_fiber_no = EXCLUDED.outgoing_fiber_no,
      splice_type = EXCLUDED.splice_type,
      status = EXCLUDED.status,
      updated_at = NOW();

    v_updated_count := v_updated_count + 1;
  END LOOP;

  -- Update OFC connections to reflect straight splicing
  UPDATE ofc_connections
  SET
    connection_type = 'straight',
    updated_at = NOW()
  WHERE ofc_connections.ofc_id = v_incoming_segment.original_cable_id
    AND ofc_connections.fiber_no_sn <= v_fiber_count;

  RETURN v_updated_count;
END;
$$;

-- Function to apply cross joint splicing
CREATE OR REPLACE FUNCTION public.apply_cross_joint_splicing(
  p_jc_id UUID,
  p_incoming_segment_id UUID,
  p_outgoing_segment_id UUID,
  p_fiber_mapping JSONB
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_mapping_record JSONB;
  v_incoming_segment RECORD;
  v_outgoing_segment RECORD;
  v_updated_count INTEGER := 0;
BEGIN
  -- Get segment information
  SELECT cs.* INTO v_incoming_segment
  FROM cable_segments cs
  WHERE cs.id = p_incoming_segment_id;

  SELECT cs.* INTO v_outgoing_segment
  FROM cable_segments cs
  WHERE cs.id = p_outgoing_segment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Segments not found';
  END IF;

  -- Process each fiber mapping
  FOR v_mapping_record IN
    SELECT jsonb_array_elements(p_fiber_mapping)
  LOOP
    -- Create or update fiber splice
    INSERT INTO fiber_splices (
      jc_id,
      incoming_cable_id,
      incoming_fiber_no,
      outgoing_cable_id,
      outgoing_fiber_no,
      splice_type,
      status,
      created_at
    ) VALUES (
      p_jc_id,
      v_incoming_segment.original_cable_id,
      (v_mapping_record->>'incoming_fiber_no')::INTEGER,
      v_outgoing_segment.original_cable_id,
      (v_mapping_record->>'outgoing_fiber_no')::INTEGER,
      'branch',
      'active',
      NOW()
    )
    ON CONFLICT (jc_id, incoming_cable_id, incoming_fiber_no)
    DO UPDATE SET
      outgoing_fiber_no = EXCLUDED.outgoing_fiber_no,
      splice_type = EXCLUDED.splice_type,
      status = EXCLUDED.status,
      updated_at = NOW();

    v_updated_count := v_updated_count + 1;
  END LOOP;

  -- Update OFC connections to reflect cross splicing
  UPDATE ofc_connections
  SET
    connection_type = 'cross',
    fiber_no_en = CASE
      WHEN ofc_connections.fiber_no_sn = (p_fiber_mapping->0->>'incoming_fiber_no')::INTEGER
      THEN (p_fiber_mapping->0->>'outgoing_fiber_no')::INTEGER
      ELSE ofc_connections.fiber_no_en
    END,
    updated_at = NOW()
  WHERE ofc_connections.ofc_id = v_incoming_segment.original_cable_id;

  RETURN v_updated_count;
END;
$$;

-- Triggers
-- Trigger function to recreate cable segments when a JC is deleted
CREATE OR REPLACE FUNCTION public.trigger_recreate_cable_segments_on_jc_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_cable_record RECORD;
  v_existing_segments INTEGER;
  v_jc_id UUID;
  v_cable_id UUID;
BEGIN
  -- Extract values to avoid column ambiguity
  v_jc_id := OLD.id;
  v_cable_id := OLD.ofc_cable_id;

  -- Log the deletion
  RAISE NOTICE 'JC deleted: % from cable: %. Recreating cable segments.',
    v_jc_id, v_cable_id;

  -- Get cable information
  SELECT oc.* INTO v_cable_record
  FROM ofc_cables oc
  WHERE oc.id = v_cable_id;

  IF NOT FOUND THEN
    RAISE NOTICE 'Cable % not found, nothing to recreate', v_cable_id;
    RETURN OLD;
  END IF;

  -- Check if there are any remaining JCs on this cable
  SELECT COUNT(*) INTO v_existing_segments
  FROM junction_closures jc
  WHERE jc.ofc_cable_id = v_cable_id;

  -- If no JCs remain, delete all segments (cable becomes one segment from start to end)
  IF v_existing_segments = 0 THEN
    DELETE FROM cable_segments WHERE original_cable_id = v_cable_id;
    RAISE NOTICE 'No JCs remaining on cable %, deleted all segments', v_cable_id;
    RETURN OLD;
  END IF;

  -- If JCs remain, delete existing segments and recreate them
  DELETE FROM cable_segments WHERE original_cable_id = v_cable_id;
  RAISE NOTICE 'Deleted % existing segments, recreating segments for remaining % JCs',
    v_existing_segments, v_existing_segments;

  -- Get cable information and remaining JCs
  CREATE TEMP TABLE temp_remaining_jcs AS
  SELECT
    'start'::TEXT as node_type,
    v_cable_record.sn_id as node_id,
    0::DECIMAL(10,3) as position_km
  UNION ALL
  SELECT
    'jc'::TEXT as node_type,
    remaining_jc.node_id as node_id,  -- Fixed: use node_id instead of id
    remaining_jc.position_km
  FROM junction_closures remaining_jc
  WHERE remaining_jc.ofc_cable_id = v_cable_id
  UNION ALL
  SELECT
    'end'::TEXT as node_type,
    v_cable_record.en_id as node_id,
    v_cable_record.current_rkm as position_km;

  -- Create segments between consecutive nodes
  INSERT INTO cable_segments (
    original_cable_id,
    segment_order,
    start_node_id,
    end_node_id,
    start_node_type,
    end_node_type,
    distance_km,
    fiber_count,
    created_at
  )
  SELECT
    v_cable_id,
    ROW_NUMBER() OVER (ORDER BY t.position_km),
    prev_node.node_id,
    t.node_id,
    CASE prev_node.node_type
      WHEN 'start' THEN 'node'
      WHEN 'jc' THEN 'jc'
      ELSE 'node'
    END,
    CASE t.node_type
      WHEN 'end' THEN 'node'
      WHEN 'jc' THEN 'jc'
      ELSE 'node'
    END,
    t.position_km - prev_node.position_km,
    v_cable_record.capacity,
    NOW()
  FROM temp_remaining_jcs t
  JOIN LATERAL (
    SELECT t2.node_id, t2.node_type, t2.position_km
    FROM temp_remaining_jcs t2
    WHERE t2.position_km < t.position_km
    ORDER BY t2.position_km DESC
    LIMIT 1
  ) prev_node ON true
  WHERE t.node_type != 'start';

  -- Clean up temp table
  DROP TABLE temp_remaining_jcs;

  -- Log completion
  RAISE NOTICE 'Successfully recreated cable segments for cable % after JC deletion', v_cable_id;

  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_create_cable_segments_on_jc()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_jc_id UUID;
  v_cable_id UUID;
BEGIN
  -- Only create segments for new junction closures (INSERT), not updates
  IF TG_OP = 'INSERT' THEN
    -- Extract values to avoid column ambiguity
    v_jc_id := NEW.id;
    v_cable_id := NEW.ofc_cable_id;

    -- Call the function to create cable segments
    PERFORM public.create_cable_segments_on_jc_add(v_jc_id, v_cable_id);

    -- Log the operation
    RAISE NOTICE 'Automatically created cable segments for new JC: % on cable: %',
      v_jc_id, v_cable_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Attach triggers
CREATE OR REPLACE TRIGGER trigger_junction_closures_updated_at
  BEFORE UPDATE ON public.junction_closures
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create cable segments when a new JC is added
CREATE OR REPLACE TRIGGER trigger_junction_closures_create_segments
  AFTER INSERT ON public.junction_closures
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_create_cable_segments_on_jc();

-- Auto-recreate cable segments when a JC is deleted
CREATE OR REPLACE TRIGGER trigger_junction_closures_delete_segments
  AFTER DELETE ON public.junction_closures
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_recreate_cable_segments_on_jc_delete();

  -- This function is now the core logic for managing how a cable is divided into segments.
-- It is called by a trigger whenever a JC is added or deleted.
CREATE OR REPLACE FUNCTION public.recalculate_segments_for_cable(p_cable_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cable RECORD;
BEGIN
  -- Get the main cable details
  SELECT * INTO v_cable FROM public.ofc_cables WHERE id = p_cable_id;
  IF NOT FOUND THEN
    RAISE WARNING 'Cable not found for segmentation: %', p_cable_id;
    RETURN;
  END IF;

  -- Delete old segments to rebuild them from scratch
  DELETE FROM public.cable_segments WHERE original_cable_id = p_cable_id;

  -- Create a temporary table of all points on the route (start node, all JCs, end node)
  CREATE TEMP TABLE route_points AS
  SELECT v_cable.sn_id AS point_id, 'node' AS point_type, 0.0 AS position_km
  UNION ALL
  SELECT jc.node_id, 'jc', jc.position_km
  FROM public.junction_closures jc
  WHERE jc.ofc_cable_id = p_cable_id
  UNION ALL
  SELECT v_cable.en_id, 'node', v_cable.current_rkm;

  -- Insert the new, correct segments based on the ordered points
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

-- This trigger function ensures segmentation is always up-to-date.
CREATE OR REPLACE FUNCTION public.trigger_manage_cable_segments()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    -- A new JC was added, recalculate segments for its parent cable.
    PERFORM public.recalculate_segments_for_cable(NEW.ofc_cable_id);
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    -- A JC was removed, recalculate segments for its parent cable.
    PERFORM public.recalculate_segments_for_cable(OLD.ofc_cable_id);
    RETURN OLD;
  END IF;
  RETURN NULL; -- Result is ignored for AFTER triggers
END;
$$;

-- Attach the trigger to the junction_closures table.
CREATE OR REPLACE TRIGGER on_junction_closure_change
AFTER INSERT OR DELETE ON public.junction_closures
FOR EACH ROW
EXECUTE FUNCTION public.trigger_manage_cable_segments();

-- Function to commit a route evolution by adding new JCs and recalculating segments
CREATE OR REPLACE FUNCTION public.commit_route_evolution(
  p_route_id UUID,
  p_planned_equipment JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  jc JSONB;
  new_node_id UUID;
  new_jc_id UUID;
  v_jc_node_type_id UUID;
  result_jcs JSONB[] := ARRAY[]::JSONB[];
BEGIN
  -- Get the Node Type ID for 'Joint / Splice Point' once to avoid repeated lookups
  SELECT id INTO v_jc_node_type_id
  FROM public.lookup_types
  WHERE category = 'NODE_TYPES' AND name = 'Joint / Splice Point'
  LIMIT 1;

  IF v_jc_node_type_id IS NULL THEN
    RAISE EXCEPTION 'Node type "Joint / Splice Point" not found in lookup_types.';
  END IF;

  -- Loop through each planned JC in the JSONB array
  FOR jc IN SELECT * FROM jsonb_array_elements(p_planned_equipment)
  LOOP
    -- 1. Create a new node for the JC
    INSERT INTO public.nodes (name, latitude, longitude, node_type_id)
    VALUES (
      jc->>'name',
      (jc->>'latitude')::NUMERIC,
      (jc->>'longitude')::NUMERIC,
      v_jc_node_type_id
    )
    RETURNING id INTO new_node_id;

    -- 2. Create the junction_closure record linking the new node and parent cable
    -- The trigger on this table will automatically handle recalculating the segments.
    INSERT INTO public.junction_closures (ofc_cable_id, node_id, position_km)
    VALUES (
      p_route_id,
      new_node_id,
      -- Calculate position in km from the percentage provided by the client
      (SELECT current_rkm FROM public.ofc_cables WHERE id = p_route_id) * ((jc->'attributes'->>'position_on_route')::NUMERIC / 100)
    )
    RETURNING id INTO new_jc_id;

    -- Add the new JC's info to our result array for returning to the client
    result_jcs := array_append(result_jcs, jsonb_build_object('id', new_jc_id, 'node_id', new_node_id, 'name', jc->>'name'));
  END LOOP;

  RETURN jsonb_build_object('created_jcs', result_jcs);
END;
$$;

-- NEW FUNCTION: To update ofc_connections based on the logical path from fiber_splices
CREATE OR REPLACE FUNCTION public.update_ofc_connections_from_splice()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    changed_splice RECORD;
    path_record RECORD;
    full_path_cursor CURSOR FOR
        WITH RECURSIVE full_trace AS (
            SELECT
                changed_splice.incoming_segment_id as segment_id,
                changed_splice.incoming_fiber_no as fiber_no,
                ARRAY[changed_splice.incoming_segment_id] as visited_segments
            UNION ALL
            SELECT
                CASE WHEN ft.segment_id = s.incoming_segment_id THEN s.outgoing_segment_id ELSE s.incoming_segment_id END,
                CASE WHEN ft.segment_id = s.incoming_segment_id THEN s.outgoing_fiber_no ELSE s.incoming_fiber_no END,
                ft.visited_segments || (CASE WHEN ft.segment_id = s.incoming_segment_id THEN s.outgoing_segment_id ELSE s.incoming_segment_id END)
            FROM full_trace ft
            JOIN fiber_splices s ON
                (ft.segment_id = s.incoming_segment_id AND ft.fiber_no = s.incoming_fiber_no) OR
                (ft.segment_id = s.outgoing_segment_id AND ft.fiber_no = s.outgoing_fiber_no)
            WHERE NOT (CASE WHEN ft.segment_id = s.incoming_segment_id THEN s.outgoing_segment_id ELSE s.incoming_segment_id END = ANY(ft.visited_segments))
        )
        SELECT ft.segment_id, ft.fiber_no, cs.original_cable_id FROM full_trace ft
        JOIN cable_segments cs ON ft.segment_id = cs.id;

    ultimate_start_fiber INT;
    ultimate_end_fiber INT;

BEGIN
    -- On DELETE, reset the connections of the deleted splice and exit.
    IF (TG_OP = 'DELETE') THEN
        UPDATE public.ofc_connections
        SET updated_fiber_no_en = fiber_no_en, updated_fiber_no_sn = fiber_no_sn
        WHERE ofc_id = (SELECT original_cable_id FROM public.cable_segments WHERE id = OLD.incoming_segment_id)
          AND fiber_no_sn = OLD.incoming_fiber_no;

        IF OLD.outgoing_segment_id IS NOT NULL THEN
             UPDATE public.ofc_connections
             SET updated_fiber_no_en = fiber_no_en, updated_fiber_no_sn = fiber_no_sn
             WHERE ofc_id = (SELECT original_cable_id FROM public.cable_segments WHERE id = OLD.outgoing_segment_id)
               AND fiber_no_sn = OLD.outgoing_fiber_no;
        END IF;
        RETURN OLD;
    END IF;

    changed_splice := NEW;

    -- STEP 1: Find the ultimate START and END fibers for the entire logical path
    OPEN full_path_cursor;
    -- Find the start fiber (trace backwards)
    SELECT fiber_no INTO ultimate_start_fiber FROM (
        WITH RECURSIVE trace_backward AS (
            SELECT changed_splice.incoming_segment_id as segment_id, changed_splice.incoming_fiber_no as fiber_no, ARRAY[changed_splice.incoming_segment_id] as history
            UNION ALL
            SELECT
                CASE WHEN p.segment_id = s.outgoing_segment_id THEN s.incoming_segment_id ELSE s.outgoing_segment_id END,
                CASE WHEN p.segment_id = s.outgoing_segment_id THEN s.incoming_fiber_no ELSE s.outgoing_fiber_no END,
                p.history || CASE WHEN p.segment_id = s.outgoing_segment_id THEN s.incoming_segment_id ELSE s.outgoing_segment_id END
            FROM trace_backward p JOIN fiber_splices s ON (p.segment_id = s.incoming_segment_id AND p.fiber_no = s.incoming_fiber_no) OR (p.segment_id = s.outgoing_segment_id AND p.fiber_no = s.outgoing_fiber_no)
            WHERE NOT (CASE WHEN p.segment_id = s.outgoing_segment_id THEN s.incoming_segment_id ELSE s.outgoing_segment_id END = ANY(p.history)) AND s.id <> changed_splice.id
        ) SELECT fiber_no FROM trace_backward ORDER BY segment_id DESC LIMIT 1
    ) AS backwards;

    -- Find the end fiber (trace forwards or set to 0 if terminated)
    IF changed_splice.outgoing_segment_id IS NULL THEN
        ultimate_end_fiber := 0;
    ELSE
        SELECT fiber_no INTO ultimate_end_fiber FROM (
            WITH RECURSIVE trace_forward AS (
                SELECT changed_splice.outgoing_segment_id as segment_id, changed_splice.outgoing_fiber_no as fiber_no, ARRAY[changed_splice.outgoing_segment_id] as history
                UNION ALL
                SELECT
                    CASE WHEN p.segment_id = s.incoming_segment_id THEN s.outgoing_segment_id ELSE s.incoming_segment_id END,
                    CASE WHEN p.segment_id = s.incoming_segment_id THEN s.outgoing_fiber_no ELSE s.incoming_fiber_no END,
                    p.history || CASE WHEN p.segment_id = s.incoming_segment_id THEN s.outgoing_segment_id ELSE s.incoming_segment_id END
                FROM trace_forward p JOIN fiber_splices s ON (p.segment_id = s.incoming_segment_id AND p.fiber_no = s.incoming_fiber_no) OR (p.segment_id = s.outgoing_segment_id AND p.fiber_no = s.outgoing_fiber_no)
                WHERE NOT (CASE WHEN p.segment_id = s.incoming_segment_id THEN s.outgoing_segment_id ELSE s.incoming_segment_id END = ANY(p.history)) AND s.id <> changed_splice.id
            ) SELECT fiber_no FROM trace_forward ORDER BY segment_id DESC LIMIT 1
        ) AS forwards;
        IF NOT FOUND THEN ultimate_end_fiber := 0; END IF;
    END IF;

    -- STEP 2: Iterate through every segment in the path and update its logical connection
    LOOP
        FETCH full_path_cursor INTO path_record;
        EXIT WHEN NOT FOUND;

        UPDATE public.ofc_connections
        SET
            updated_fiber_no_sn = ultimate_start_fiber,
            updated_fiber_no_en = ultimate_end_fiber
        WHERE ofc_id = path_record.original_cable_id AND fiber_no_sn = path_record.fiber_no;
    END LOOP;
    CLOSE full_path_cursor;

    RETURN NEW;
END;
$$;


-- TRIGGER: This remains the same, but it will now call the powerful new function.
DROP TRIGGER IF EXISTS trigger_after_splice_change ON public.fiber_splices;
CREATE TRIGGER trigger_after_splice_change
AFTER INSERT OR UPDATE OR DELETE ON public.fiber_splices
FOR EACH ROW
EXECUTE FUNCTION public.update_ofc_connections_from_splice();