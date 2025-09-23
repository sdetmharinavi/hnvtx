-- Path: supabase/migrations/06_utilities/01_generic_functions.sql
-- Description: A collection of generic, reusable utility functions for querying, pagination, and data manipulation.

-- =================================================================
-- Section 1: Generic Query Execution Functions
-- =================================================================

-- Function to execute a read-only SQL query and return the result as JSON.
-- Restricted to SELECT and WITH for security.
DROP FUNCTION IF EXISTS public.execute_sql(TEXT);
CREATE OR REPLACE FUNCTION public.execute_sql(sql_query TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  cleaned_query TEXT;
  result_json JSON;
BEGIN
  cleaned_query := lower(ltrim(sql_query));
  IF cleaned_query NOT LIKE 'select %' AND cleaned_query NOT LIKE 'with %' THEN
    RAISE EXCEPTION 'Only SELECT and WITH statements are allowed';
  END IF;

  EXECUTE 'SELECT json_agg(t) FROM (' || sql_query || ') t' INTO result_json;
  RETURN json_build_object('result', COALESCE(result_json, '[]'::json));
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('error', SQLERRM);
END;
$$;
GRANT EXECUTE ON FUNCTION public.execute_sql(TEXT) TO authenticated;


-- Function to get distinct values from a specified column, with optional filtering.
CREATE OR REPLACE FUNCTION public.get_unique_values(
    p_table_name TEXT,
    p_column_name TEXT,
    p_filters JSONB DEFAULT '{}'::jsonb,
    p_order_by JSONB DEFAULT '[]'::jsonb,
    p_limit_count INTEGER DEFAULT NULL
)
RETURNS TABLE(value JSONB)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  query_text TEXT;
  where_clause TEXT := '';
  order_clause TEXT := '';
  limit_clause TEXT := '';
BEGIN
    -- Build WHERE clause
    IF jsonb_typeof(p_filters) = 'object' AND p_filters != '{}'::jsonb THEN
        SELECT string_agg(format('%I = %L', key, p_filters->>key), ' AND ')
        INTO where_clause FROM jsonb_object_keys(p_filters) key;
        IF where_clause IS NOT NULL THEN where_clause := 'WHERE ' || where_clause; END IF;
    END IF;
    -- Build ORDER BY clause
    IF jsonb_typeof(p_order_by) = 'array' AND jsonb_array_length(p_order_by) > 0 THEN
        SELECT string_agg(
            format('%I %s', item->>'column', CASE WHEN (item->>'ascending')::boolean THEN 'ASC' ELSE 'DESC' END), ', '
        ) INTO order_clause FROM jsonb_array_elements(p_order_by) AS item;
        IF order_clause IS NOT NULL THEN order_clause := 'ORDER BY ' || order_clause; END IF;
    END IF;
    -- Build LIMIT clause
    IF p_limit_count IS NOT NULL THEN
        limit_clause := format('LIMIT %s', p_limit_count);
    END IF;
    -- Construct and execute query
    query_text := format('SELECT DISTINCT %I as value FROM %I %s %s %s', p_column_name, p_table_name, where_clause, order_clause, limit_clause);
    RETURN QUERY EXECUTE format('SELECT to_jsonb(t.value) FROM (%s) t', query_text);
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_unique_values(TEXT, TEXT, JSONB, JSONB, INTEGER) TO authenticated;


-- =================================================================
-- Section 2: Lookup and Enumeration Functions
-- =================================================================

-- Securely get the ID of a lookup type by its category and name.
CREATE OR REPLACE FUNCTION public.get_lookup_type_id(p_category TEXT, p_name TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_type_id UUID;
BEGIN
  SELECT id INTO v_type_id FROM public.lookup_types
  WHERE category = p_category AND name = p_name AND status = true;
  IF v_type_id IS NULL THEN
    RAISE EXCEPTION 'Lookup type not found for category=% and name=%', p_category, p_name;
  END IF;
  RETURN v_type_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_lookup_type_id(TEXT, TEXT) TO authenticated;


-- Add a new lookup type entry.
CREATE OR REPLACE FUNCTION public.add_lookup_type(
  p_category TEXT, p_name TEXT, p_code TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL, p_sort_order INTEGER DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_type_id UUID;
BEGIN
  INSERT INTO public.lookup_types (category, name, code, description, sort_order)
  VALUES (p_category, p_name, p_code, p_description, p_sort_order)
  RETURNING id INTO v_type_id;
  RETURN v_type_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.add_lookup_type(TEXT, TEXT, TEXT, TEXT, INTEGER) TO authenticated;


-- Get all active lookup types for a given category.
CREATE OR REPLACE FUNCTION public.get_lookup_types_by_category(p_category TEXT)
RETURNS TABLE (id UUID, name TEXT, code TEXT, description TEXT, sort_order INTEGER)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT lt.id, lt.name, lt.code, lt.description, lt.sort_order
  FROM public.lookup_types lt
  WHERE lt.category = p_category AND lt.status = true
  ORDER BY lt.sort_order, lt.name;
$$;
GRANT EXECUTE ON FUNCTION public.get_lookup_types_by_category(TEXT) TO authenticated;


-- =================================================================
-- Section 3: Generic Data Operation Functions
-- =================================================================

-- Perform bulk updates on a table from a JSONB array of updates.
CREATE OR REPLACE FUNCTION public.bulk_update(
    p_table_name TEXT,
    p_updates JSONB,
    p_batch_size INTEGER DEFAULT 1000
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  update_item JSONB;
  set_clause TEXT;
  query_text TEXT;
  updated_count INTEGER := 0;
BEGIN
  FOR update_item IN SELECT * FROM jsonb_array_elements(p_updates) LOOP
    SELECT string_agg(format('%I = %L', key, value), ', ')
    INTO set_clause
    FROM jsonb_each_text(update_item->'data');

    IF set_clause IS NOT NULL THEN
      query_text := format('UPDATE public.%I SET %s, updated_at = NOW() WHERE id = %L',
        p_table_name, set_clause, update_item->>'id');
      EXECUTE query_text;
      GET DIAGNOSTICS updated_count = ROW_COUNT;
    END IF;
  END LOOP;
  RETURN jsonb_build_object('updated_count', updated_count);
END;
$$;
GRANT EXECUTE ON FUNCTION public.bulk_update(TEXT, JSONB, INTEGER) TO authenticated;


-- =================================================================
-- Section 4: OFC and Splicing Specific Utility Functions
-- =================================================================

-- Provision a working and protection fiber pair on a logical path.
CREATE OR REPLACE FUNCTION public.provision_ring_path(
    p_system_id UUID, p_path_name TEXT, p_working_fiber_no INT,
    p_protection_fiber_no INT, p_physical_path_id UUID
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
    IF v_active_status_id IS NULL THEN RAISE EXCEPTION 'Operational status "active" not found.'; END IF;

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
GRANT EXECUTE ON FUNCTION public.provision_ring_path(UUID, TEXT, INT, INT, UUID) TO authenticated;


-- Get all data needed for the Splice Matrix UI for a specific JC.
CREATE OR REPLACE FUNCTION public.get_jc_splicing_details(p_jc_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
BEGIN
    WITH RECURSIVE connected_cables AS (
        SELECT DISTINCT cable_id FROM (
            SELECT incoming_cable_id AS cable_id FROM public.fiber_splices WHERE jc_id = p_jc_id
            UNION
            SELECT outgoing_cable_id AS cable_id FROM public.fiber_splices WHERE jc_id = p_jc_id AND outgoing_cable_id IS NOT NULL
        ) AS cables
    ),
    cables_with_fibers AS (
        SELECT c.id AS cable_id, c.route_name, c.capacity, sn.name AS start_node_name, en.name AS end_node_name, generate_series(1, c.capacity) AS fiber_no
        FROM public.ofc_cables c JOIN connected_cables cc ON c.id = cc.cable_id
        LEFT JOIN public.nodes sn ON c.sn_id = sn.id
        LEFT JOIN public.nodes en ON c.en_id = en.id
    ),
    fiber_splice_info AS (
        SELECT
            cf.cable_id, cf.route_name, cf.start_node_name, cf.end_node_name, cf.capacity, cf.fiber_no,
            fs_in.id AS splice_id_in, fs_in.outgoing_cable_id, fs_in.outgoing_fiber_no, out_cable.route_name AS outgoing_route_name,
            fs_out.id AS splice_id_out, fs_out.incoming_cable_id, fs_out.incoming_fiber_no, in_cable.route_name AS incoming_route_name,
            CASE
                WHEN fs_in.splice_type = 'termination' THEN 'terminated'
                WHEN fs_in.id IS NOT NULL THEN 'used_as_incoming'
                WHEN fs_out.id IS NOT NULL THEN 'used_as_outgoing'
                ELSE 'available'
            END AS status,
            COALESCE(fs_in.logical_path_id, fs_out.logical_path_id) AS logical_path_id
        FROM cables_with_fibers cf
        LEFT JOIN public.fiber_splices fs_in ON cf.cable_id = fs_in.incoming_cable_id AND cf.fiber_no = fs_in.incoming_fiber_no AND fs_in.jc_id = p_jc_id
        LEFT JOIN public.fiber_splices fs_out ON cf.cable_id = fs_out.outgoing_cable_id AND cf.fiber_no = fs_out.outgoing_fiber_no AND fs_out.jc_id = p_jc_id
        LEFT JOIN public.ofc_cables out_cable ON fs_in.outgoing_cable_id = out_cable.id
        LEFT JOIN public.ofc_cables in_cable ON fs_out.incoming_cable_id = in_cable.id
    )
    SELECT jsonb_build_object(
        'jc_details', (SELECT to_jsonb(jc.*) FROM public.junction_closures jc WHERE jc.id = p_jc_id),
        'cables', (
            SELECT jsonb_agg(DISTINCT jsonb_build_object(
                'cable_id', fsi.cable_id, 'route_name', fsi.route_name, 'capacity', fsi.capacity,
                'start_node', fsi.start_node_name, 'end_node', fsi.end_node_name,
                'fibers', (
                    SELECT jsonb_agg(jsonb_build_object(
                        'fiber_no', sub.fiber_no, 'status', sub.status,
                        'splice_id', COALESCE(sub.splice_id_in, sub.splice_id_out),
                        'connected_to_cable', COALESCE(sub.outgoing_route_name, sub.incoming_route_name),
                        'connected_to_fiber', COALESCE(sub.outgoing_fiber_no, sub.incoming_fiber_no)
                    ) ORDER BY sub.fiber_no)
                    FROM fiber_splice_info sub WHERE sub.cable_id = fsi.cable_id
                )
            ))
            FROM fiber_splice_info fsi
        )
    ) INTO result;
    RETURN result;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_jc_splicing_details(UUID) TO authenticated;


-- Automatically create 1-to-1 "straight" splices for available fibers between two cables.
CREATE OR REPLACE FUNCTION public.auto_splice_straight(p_jc_id UUID, p_cable1_id UUID, p_cable2_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    cable1_capacity INT; cable2_capacity INT; i INT; splice_count INT := 0;
    available_fibers_c1 INT[]; available_fibers_c2 INT[];
BEGIN
    SELECT capacity INTO cable1_capacity FROM public.ofc_cables WHERE id = p_cable1_id;
    SELECT capacity INTO cable2_capacity FROM public.ofc_cables WHERE id = p_cable2_id;
    IF cable1_capacity IS NULL OR cable2_capacity IS NULL THEN RAISE EXCEPTION 'One or both cables not found.'; END IF;

    SELECT array_agg(s.i) INTO available_fibers_c1 FROM generate_series(1, cable1_capacity) s(i)
    WHERE NOT EXISTS (SELECT 1 FROM public.fiber_splices fs WHERE fs.jc_id = p_jc_id AND ((fs.incoming_cable_id = p_cable1_id AND fs.incoming_fiber_no = s.i) OR (fs.outgoing_cable_id = p_cable1_id AND fs.outgoing_fiber_no = s.i)));
    SELECT array_agg(s.i) INTO available_fibers_c2 FROM generate_series(1, cable2_capacity) s(i)
    WHERE NOT EXISTS (SELECT 1 FROM public.fiber_splices fs WHERE fs.jc_id = p_jc_id AND ((fs.incoming_cable_id = p_cable2_id AND fs.incoming_fiber_no = s.i) OR (fs.outgoing_cable_id = p_cable2_id AND fs.outgoing_fiber_no = s.i)));

    FOR i IN 1..LEAST(cardinality(available_fibers_c1), cardinality(available_fibers_c2)) LOOP
        INSERT INTO public.fiber_splices (jc_id, incoming_cable_id, incoming_fiber_no, outgoing_cable_id, outgoing_fiber_no, splice_type)
        VALUES (p_jc_id, p_cable1_id, available_fibers_c1[i], p_cable2_id, available_fibers_c2[i], 'pass_through');
        splice_count := splice_count + 1;
    END LOOP;
    RETURN jsonb_build_object('status', 'success', 'splices_created', splice_count);
END;
$$;
GRANT EXECUTE ON FUNCTION public.auto_splice_straight(UUID, UUID, UUID) TO authenticated;


-- RPC function to handle creating, deleting, and updating splices.
CREATE OR REPLACE FUNCTION public.manage_splice(
    p_action TEXT, p_jc_id UUID, p_splice_id UUID DEFAULT NULL, p_incoming_cable_id UUID DEFAULT NULL,
    p_incoming_fiber_no INT DEFAULT NULL, p_outgoing_cable_id UUID DEFAULT NULL, p_outgoing_fiber_no INT DEFAULT NULL,
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
        INSERT INTO public.fiber_splices (jc_id, incoming_cable_id, incoming_fiber_no, outgoing_cable_id, outgoing_fiber_no, splice_type, otdr_length_km)
        VALUES (p_jc_id, p_incoming_cable_id, p_incoming_fiber_no, p_outgoing_cable_id, p_outgoing_fiber_no, p_splice_type, p_otdr_length_km)
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


-- Get a list of all OFC cables present at a specific Junction Closure.
CREATE OR REPLACE FUNCTION public.get_cables_at_jc(p_jc_id UUID)
RETURNS TABLE (id UUID, route_name TEXT, capacity INT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    WITH jc_node_info AS (
        SELECT n.id as node_id FROM public.junction_closures jc
        JOIN public.nodes n ON jc.latitude = n.latitude AND jc.longitude = n.longitude
        WHERE jc.id = p_jc_id
    )
    SELECT c.id, c.route_name, c.capacity
    FROM public.ofc_cables c
    WHERE c.sn_id = (SELECT node_id FROM jc_node_info) OR c.en_id = (SELECT node_id FROM jc_node_info);
$$;
GRANT EXECUTE ON FUNCTION public.get_cables_at_jc(UUID) TO authenticated;


-- Get a list of all splices with their JC details.
CREATE OR REPLACE FUNCTION public.get_all_splices()
RETURNS TABLE (
    splice_id UUID, jc_id UUID, jc_name TEXT, jc_position_km NUMERIC,
    incoming_cable_id UUID, incoming_fiber_no INT, outgoing_cable_id UUID,
    outgoing_fiber_no INT, otdr_length_km NUMERIC, loss_db NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT s.id, s.jc_id, jc.name, jc.position_km, s.incoming_cable_id,
           s.incoming_fiber_no, s.outgoing_cable_id, s.outgoing_fiber_no,
           s.otdr_length_km, s.loss_db
    FROM public.fiber_splices s
    JOIN public.junction_closures jc ON s.jc_id = jc.id;
$$;
GRANT EXECUTE ON FUNCTION public.get_all_splices() TO authenticated;


-- Trace a fiber's path from a starting point through splices.
CREATE OR REPLACE FUNCTION public.trace_fiber_path(p_start_cable_id UUID, p_start_fiber_no INT)
RETURNS TABLE (
    segment_order BIGINT, path_type TEXT, element_id UUID,
    element_name TEXT, details TEXT, fiber_no INT,
    distance_km NUMERIC, loss_db NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE path_traversal AS (
        SELECT 1::BIGINT AS segment_order, p_start_cable_id AS current_cable_id, p_start_fiber_no AS current_fiber_no, 0::NUMERIC AS last_position_km
        UNION ALL
        SELECT p.segment_order + 1, s.outgoing_cable_id, s.outgoing_fiber_no, jc.position_km
        FROM path_traversal p
        JOIN public.fiber_splices s ON p.current_cable_id = s.incoming_cable_id AND p.current_fiber_no = s.incoming_fiber_no
        JOIN public.junction_closures jc ON s.jc_id = jc.id
        WHERE s.outgoing_cable_id IS NOT NULL AND p.segment_order < 50 -- Safety break
    )
    SELECT
        ROW_NUMBER() OVER (ORDER BY pt.segment_order, z.type_order) AS final_segment_order,
        z.path_type, z.element_id, z.element_name, z.details, z.fiber_no, z.distance_km, z.loss_db
    FROM path_traversal pt
    CROSS JOIN LATERAL (
        SELECT 1 AS type_order, 'CABLE'::TEXT, pt.current_cable_id, c.route_name, (sn.name || ' → ' || en.name)::TEXT, pt.current_fiber_no,
               ABS(COALESCE((SELECT jc_next.position_km FROM junction_closures jc_next JOIN fiber_splices s_next ON jc_next.id = s_next.jc_id WHERE s_next.incoming_cable_id = pt.current_cable_id AND s_next.incoming_fiber_no = pt.current_fiber_no LIMIT 1), c.current_rkm) - pt.last_position_km) AS distance_km,
               NULL::NUMERIC
        FROM public.ofc_cables c JOIN public.nodes sn ON c.sn_id = sn.id JOIN public.nodes en ON c.en_id = en.id WHERE c.id = pt.current_cable_id
        UNION ALL
        SELECT 2 AS type_order, 'JC'::TEXT, s.jc_id, jc.name, 'Splice'::TEXT, s.outgoing_fiber_no, NULL::NUMERIC, s.loss_db
        FROM public.fiber_splices s JOIN public.junction_closures jc ON s.jc_id = jc.id
        WHERE s.incoming_cable_id = pt.current_cable_id AND s.incoming_fiber_no = pt.current_fiber_no
    ) AS z
    WHERE z.element_id IS NOT NULL ORDER BY final_segment_order;
END;
$$;
GRANT EXECUTE ON FUNCTION public.trace_fiber_path(UUID, INT) TO authenticated;