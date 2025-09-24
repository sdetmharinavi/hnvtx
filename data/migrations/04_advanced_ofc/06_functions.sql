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

-- Function to update fiber connections when splicing occurs
CREATE OR REPLACE FUNCTION public.update_fiber_connections_on_splice(
  p_jc_id UUID,
  p_incoming_segment_id UUID,
  p_outgoing_segment_id UUID,
  p_splice_config JSONB
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_splice_record JSONB;
  v_updated_count INTEGER := 0;
BEGIN
  -- Process each splice in the configuration
  FOR v_splice_record IN
    SELECT jsonb_array_elements(p_splice_config)
  LOOP
    -- Update the fiber connections based on splice configuration
    UPDATE ofc_connections
    SET
      fiber_no_en = (v_splice_record->>'outgoing_fiber_no')::INTEGER,
      connection_type = COALESCE(v_splice_record->>'splice_type', 'straight'),
      updated_at = NOW()
    WHERE
      ofc_connections.ofc_id = (SELECT cs.original_cable_id FROM cable_segments cs WHERE cs.id = p_incoming_segment_id)
      AND ofc_connections.fiber_no_sn = (v_splice_record->>'incoming_fiber_no')::INTEGER;

    v_updated_count := v_updated_count + 1;
  END LOOP;

  RETURN v_updated_count;
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