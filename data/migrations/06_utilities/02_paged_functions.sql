-- =================================================================
-- Section 2: Generic Pagination Functions
-- =================================================================
-- These functions build dynamic SQL. They are constructed to be secure
-- using format() with %I for identifiers and %L for literals.

-- Helper function to build the WHERE clause dynamically. This is used by all functions below.
-- FIX: Now correctly handles the 'or' filter as a special case.
CREATE OR REPLACE FUNCTION public.build_where_clause(p_filters JSONB, p_alias TEXT DEFAULT 'v')
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  where_clause TEXT := '';
  filter_key TEXT;
  filter_value JSONB; -- Changed from TEXT to JSONB to inspect the type
  alias_prefix TEXT;
BEGIN
    alias_prefix := CASE WHEN p_alias IS NOT NULL AND p_alias != '' THEN format('%I.', p_alias) ELSE '' END;

    IF p_filters IS NOT NULL AND jsonb_typeof(p_filters) = 'object' AND p_filters != '{}'::jsonb THEN
        FOR filter_key, filter_value IN SELECT key, value FROM jsonb_each(p_filters) LOOP

            IF filter_value IS NULL OR filter_value = '""'::jsonb THEN
                CONTINUE; -- Skip null or empty string filters
            END IF;

            -- Special handler for the 'or' filter
            IF filter_key = 'or' OR filter_key = '$or' THEN
                where_clause := where_clause || format(' AND (%s)', filter_value->>0);
                CONTINUE;
            END IF;

            -- Handler for JSON arrays -> generates an 'IN' clause
            IF jsonb_typeof(filter_value) = 'array' THEN
                -- Important: We assume UUIDs for '_id' columns and TEXT for others.
                -- The elements are extracted as text and properly quoted using %L.
                where_clause := where_clause || format(
                    ' AND %s%I IN (SELECT value::text FROM jsonb_array_elements_text(%L))',
                    alias_prefix, filter_key, filter_value
                );
            -- Handler for simple values (string, number, boolean)
            ELSE
                IF right(filter_key, 3) = '_id' OR jsonb_typeof(filter_value) = 'boolean' THEN
                    where_clause := where_clause || format(' AND %s%I::text = %L', alias_prefix, filter_key, filter_value->>0);
                ELSE
                    where_clause := where_clause || format(' AND %s%I::text ILIKE %L', alias_prefix, filter_key, '%' || (filter_value->>0) || '%');
                END IF;
            END IF;

        END LOOP;
    END IF;
    RETURN where_clause;
END;
$$;


-- Paged function for v_nodes_complete
CREATE OR REPLACE FUNCTION public.get_paged_nodes_complete(p_limit INT, p_offset INT, p_order_by TEXT DEFAULT 'name', p_order_dir TEXT DEFAULT 'asc', p_filters JSONB DEFAULT '{}')
RETURNS TABLE(id UUID, name TEXT, created_at TIMESTAMPTZ, latitude NUMERIC, longitude NUMERIC, maintenance_area_name TEXT, node_type_name TEXT, remark TEXT, status BOOLEAN, updated_at TIMESTAMPTZ, total_count BIGINT, active_count BIGINT, inactive_count BIGINT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY EXECUTE format(
    'SELECT v.id, v.name, v.created_at, v.latitude, v.longitude, v.maintenance_area_name, v.node_type_name, v.remark, v.status, v.updated_at,
      count(*) OVER() AS total_count, sum(CASE WHEN v.status THEN 1 ELSE 0 END) OVER() AS active_count, sum(CASE WHEN NOT v.status THEN 1 ELSE 0 END) OVER() AS inactive_count
    FROM public.v_nodes_complete v WHERE 1=1 %s ORDER BY v.%I %s LIMIT %L OFFSET %L',
    public.build_where_clause(p_filters), p_order_by, p_order_dir, p_limit, p_offset);
END; $$;
GRANT EXECUTE ON FUNCTION public.get_paged_nodes_complete(INT, INT, TEXT, TEXT, JSONB) TO authenticated;

-- Paged function for v_ofc_cables_complete
CREATE OR REPLACE FUNCTION public.get_paged_ofc_cables_complete(p_limit INT, p_offset INT, p_order_by TEXT DEFAULT 'route_name', p_order_dir TEXT DEFAULT 'asc', p_filters JSONB DEFAULT '{}')
RETURNS TABLE(id UUID, route_name TEXT, sn_name TEXT, en_name TEXT, capacity INT, ofc_type_name TEXT, ofc_owner_name TEXT, current_rkm NUMERIC, maintenance_area_name TEXT, commissioned_on DATE, status BOOLEAN, remark TEXT, updated_at TIMESTAMPTZ, total_count BIGINT, active_count BIGINT, inactive_count BIGINT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY EXECUTE format(
    'SELECT v.id, v.route_name, v.sn_name, v.en_name, v.capacity, v.ofc_type_name, v.ofc_owner_name, v.current_rkm, v.maintenance_area_name, v.commissioned_on, v.status, v.remark, v.updated_at,
           count(*) OVER() AS total_count, sum(CASE WHEN v.status THEN 1 ELSE 0 END) OVER() AS active_count, sum(CASE WHEN NOT v.status THEN 1 ELSE 0 END) OVER() AS inactive_count
    FROM public.v_ofc_cables_complete v WHERE 1=1 %s ORDER BY v.%I %s LIMIT %L OFFSET %L',
    public.build_where_clause(p_filters), p_order_by, p_order_dir, p_limit, p_offset);
END; $$;
GRANT EXECUTE ON FUNCTION public.get_paged_ofc_cables_complete(INT, INT, TEXT, TEXT, JSONB) TO authenticated;

-- Paged function for v_rings_with_count
CREATE OR REPLACE FUNCTION public.get_paged_rings_with_count(p_limit INT, p_offset INT, p_order_by TEXT DEFAULT 'name', p_order_dir TEXT DEFAULT 'asc', p_filters JSONB DEFAULT '{}')
RETURNS TABLE(id UUID, name TEXT, ring_type_name TEXT, maintenance_area_name TEXT, total_nodes INT, status BOOLEAN, total_count BIGINT, active_count BIGINT, inactive_count BIGINT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY EXECUTE format(
    'SELECT v.id, v.name, v.ring_type_name, v.maintenance_area_name, v.total_nodes, v.status,
           count(*) OVER() AS total_count, sum(CASE WHEN v.status THEN 1 ELSE 0 END) OVER() AS active_count, sum(CASE WHEN NOT v.status THEN 1 ELSE 0 END) OVER() AS inactive_count
    FROM public.v_rings_with_count v WHERE 1=1 %s ORDER BY v.%I %s LIMIT %L OFFSET %L',
    public.build_where_clause(p_filters), p_order_by, p_order_dir, p_limit, p_offset);
END; $$;
GRANT EXECUTE ON FUNCTION public.get_paged_rings_with_count(INT, INT, TEXT, TEXT, JSONB) TO authenticated;

-- Paged function for v_ofc_connections_complete
CREATE OR REPLACE FUNCTION public.get_paged_ofc_connections_complete(p_limit INT, p_offset INT, p_order_by TEXT DEFAULT 'fiber_no_sn', p_order_dir TEXT DEFAULT 'asc', p_filters JSONB DEFAULT '{}')
RETURNS TABLE(id UUID, ofc_route_name TEXT, fiber_no_sn INT, sn_name TEXT, system_name TEXT, en_name TEXT, fiber_role TEXT, status BOOLEAN, total_count BIGINT, active_count BIGINT, inactive_count BIGINT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY EXECUTE format(
    'SELECT v.id, v.ofc_route_name, v.fiber_no_sn, v.sn_name, v.system_name, v.en_name, v.fiber_role, v.status,
           count(*) OVER() AS total_count, sum(CASE WHEN v.status THEN 1 ELSE 0 END) OVER() AS active_count, sum(CASE WHEN NOT v.status THEN 1 ELSE 0 END) OVER() AS inactive_count
    FROM public.v_ofc_connections_complete v WHERE 1=1 %s ORDER BY v.%I %s LIMIT %L OFFSET %L',
    public.build_where_clause(p_filters), p_order_by, p_order_dir, p_limit, p_offset);
END; $$;
GRANT EXECUTE ON FUNCTION public.get_paged_ofc_connections_complete(INT, INT, TEXT, TEXT, JSONB) TO authenticated;

-- Paged function for v_systems_complete
CREATE OR REPLACE FUNCTION public.get_paged_systems_complete(p_limit INT, p_offset INT, p_order_by TEXT DEFAULT 'system_name', p_order_dir TEXT DEFAULT 'asc', p_filters JSONB DEFAULT '{}')
RETURNS TABLE(id UUID, system_name TEXT, system_type_name TEXT, node_name TEXT, ip_address INET, status BOOLEAN, remark TEXT, total_count BIGINT, active_count BIGINT, inactive_count BIGINT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY EXECUTE format(
    'SELECT v.id, v.system_name, v.system_type_name, v.node_name, v.ip_address, v.status, v.remark,
           count(*) OVER() AS total_count, sum(CASE WHEN v.status THEN 1 ELSE 0 END) OVER() AS active_count, sum(CASE WHEN NOT v.status THEN 1 ELSE 0 END) OVER() AS inactive_count
    FROM public.v_systems_complete v WHERE 1=1 %s ORDER BY v.%I %s LIMIT %L OFFSET %L',
    public.build_where_clause(p_filters), p_order_by, p_order_dir, p_limit, p_offset);
END; $$;
GRANT EXECUTE ON FUNCTION public.get_paged_systems_complete(INT, INT, TEXT, TEXT, JSONB) TO authenticated;

-- Paged function for v_system_connections_complete
CREATE OR REPLACE FUNCTION public.get_paged_system_connections_complete(p_limit INT, p_offset INT, p_order_by TEXT DEFAULT 'system_name', p_order_dir TEXT DEFAULT 'asc', p_filters JSONB DEFAULT '{}')
RETURNS TABLE(id UUID, system_name TEXT, system_type_name TEXT, media_type_name TEXT, sn_name TEXT, sn_node_name TEXT, en_name TEXT, en_node_name TEXT, connected_system_name TEXT, status BOOLEAN, total_count BIGINT, active_count BIGINT, inactive_count BIGINT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY EXECUTE format(
    'SELECT v.id, v.system_name, v.system_type_name, v.media_type_name, v.sn_name, v.sn_node_name, v.en_name, v.en_node_name, v.connected_system_name, v.status,
           count(*) OVER() AS total_count, sum(CASE WHEN v.status THEN 1 ELSE 0 END) OVER() AS active_count, sum(CASE WHEN NOT v.status THEN 1 ELSE 0 END) OVER() AS inactive_count
    FROM public.v_system_connections_complete v WHERE 1=1 %s ORDER BY v.%I %s LIMIT %L OFFSET %L',
    public.build_where_clause(p_filters), p_order_by, p_order_dir, p_limit, p_offset);
END; $$;
GRANT EXECUTE ON FUNCTION public.get_paged_system_connections_complete(INT, INT, TEXT, TEXT, JSONB) TO authenticated;

-- Paged function for v_lookup_types_with_count
CREATE OR REPLACE FUNCTION public.get_paged_lookup_types_with_count(p_limit INT, p_offset INT, p_order_by TEXT DEFAULT 'name', p_order_dir TEXT DEFAULT 'asc', p_filters JSONB DEFAULT '{}')
RETURNS TABLE(id UUID, category TEXT, name TEXT, code TEXT, description TEXT, sort_order INT, status BOOLEAN, total_count BIGINT, active_count BIGINT, inactive_count BIGINT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY EXECUTE format(
    'SELECT v.id, v.category, v.name, v.code, v.description, v.sort_order, v.status,
           count(*) OVER() AS total_count, sum(CASE WHEN v.status THEN 1 ELSE 0 END) OVER() AS active_count, sum(CASE WHEN NOT v.status THEN 1 ELSE 0 END) OVER() AS inactive_count
    FROM public.v_lookup_types_with_count v WHERE 1=1 %s ORDER BY v.%I %s LIMIT %L OFFSET %L',
    public.build_where_clause(p_filters), p_order_by, p_order_dir, p_limit, p_offset);
END; $$;
GRANT EXECUTE ON FUNCTION public.get_paged_lookup_types_with_count(INT, INT, TEXT, TEXT, JSONB) TO authenticated;

-- Paged function for v_maintenance_areas_with_count
CREATE OR REPLACE FUNCTION public.get_paged_maintenance_areas_with_count(p_limit INT, p_offset INT, p_order_by TEXT DEFAULT 'name', p_order_dir TEXT DEFAULT 'asc', p_filters JSONB DEFAULT '{}')
RETURNS TABLE(id UUID, name TEXT, code TEXT, maintenance_area_type_name TEXT, contact_person TEXT, contact_number TEXT, status BOOLEAN, total_count BIGINT, active_count BIGINT, inactive_count BIGINT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY EXECUTE format(
    'SELECT v.id, v.name, v.code, v.maintenance_area_type_name, v.contact_person, v.contact_number, v.status,
           count(*) OVER() AS total_count, sum(CASE WHEN v.status THEN 1 ELSE 0 END) OVER() AS active_count, sum(CASE WHEN NOT v.status THEN 1 ELSE 0 END) OVER() AS inactive_count
    FROM public.v_maintenance_areas_with_count v WHERE 1=1 %s ORDER BY v.%I %s LIMIT %L OFFSET %L',
    public.build_where_clause(p_filters), p_order_by, p_order_dir, p_limit, p_offset);
END; $$;
GRANT EXECUTE ON FUNCTION public.get_paged_maintenance_areas_with_count(INT, INT, TEXT, TEXT, JSONB) TO authenticated;

-- Paged function for v_employee_designations_with_count
CREATE OR REPLACE FUNCTION public.get_paged_employee_designations_with_count(p_limit INT, p_offset INT, p_order_by TEXT DEFAULT 'name', p_order_dir TEXT DEFAULT 'asc', p_filters JSONB DEFAULT '{}')
RETURNS TABLE(id UUID, name TEXT, parent_id UUID, status BOOLEAN, total_count BIGINT, active_count BIGINT, inactive_count BIGINT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY EXECUTE format(
    'SELECT v.id, v.name, v.parent_id, v.status,
           count(*) OVER() AS total_count, sum(CASE WHEN v.status THEN 1 ELSE 0 END) OVER() AS active_count, sum(CASE WHEN NOT v.status THEN 1 ELSE 0 END) OVER() AS inactive_count
    FROM public.v_employee_designations_with_count v WHERE 1=1 %s ORDER BY v.%I %s LIMIT %L OFFSET %L',
    public.build_where_clause(p_filters), p_order_by, p_order_dir, p_limit, p_offset);
END; $$;
GRANT EXECUTE ON FUNCTION public.get_paged_employee_designations_with_count(INT, INT, TEXT, TEXT, JSONB) TO authenticated;

-- Paged function for v_employees_with_count
CREATE OR REPLACE FUNCTION public.get_paged_employees_with_count(p_limit INT, p_offset INT, p_order_by TEXT DEFAULT 'employee_name', p_order_dir TEXT DEFAULT 'asc', p_filters JSONB DEFAULT '{}')
RETURNS TABLE(id UUID, employee_name TEXT, employee_pers_no TEXT, employee_designation_name TEXT, employee_contact TEXT, status BOOLEAN, total_count BIGINT, active_count BIGINT, inactive_count BIGINT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY EXECUTE format(
    'SELECT v.id, v.employee_name, v.employee_pers_no, v.employee_designation_name, v.employee_contact, v.status,
           count(*) OVER() AS total_count, sum(CASE WHEN v.status THEN 1 ELSE 0 END) OVER() AS active_count, sum(CASE WHEN NOT v.status THEN 1 ELSE 0 END) OVER() AS inactive_count
    FROM public.v_employees_with_count v WHERE 1=1 %s ORDER BY v.%I %s LIMIT %L OFFSET %L',
    public.build_where_clause(p_filters), p_order_by, p_order_dir, p_limit, p_offset);
END; $$;
GRANT EXECUTE ON FUNCTION public.get_paged_employees_with_count(INT, INT, TEXT, TEXT, JSONB) TO authenticated;
