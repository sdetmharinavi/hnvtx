-- Path: supabase/migrations/06_utilities/02_dashboard_and_pagination_functions.sql
-- Description: Contains functions for dashboard aggregations and a complete set of generic pagination functions for all major views.

-- =================================================================
-- Section 1: Dashboard and Aggregation Functions
-- =================================================================

-- Get a JSONB object with various aggregated counts and stats for a dashboard overview.
CREATE OR REPLACE FUNCTION public.get_dashboard_overview()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'system_status_counts', (SELECT jsonb_object_agg(CASE WHEN status THEN 'Active' ELSE 'Inactive' END, count) FROM (SELECT status, COUNT(*) as count FROM public.systems GROUP BY status) as s),
        'node_status_counts', (SELECT jsonb_object_agg(CASE WHEN status THEN 'Active' ELSE 'Inactive' END, count) FROM (SELECT status, COUNT(*) as count FROM public.nodes GROUP BY status) as n),
        'path_operational_status', (SELECT jsonb_object_agg(lt.name, p.count) FROM (SELECT operational_status_id, COUNT(*) as count FROM public.logical_fiber_paths WHERE operational_status_id IS NOT NULL GROUP BY operational_status_id) as p JOIN lookup_types lt ON p.operational_status_id = lt.id),
        'cable_utilization_summary', (SELECT jsonb_build_object('average_utilization_percent', ROUND(AVG(utilization_percent)::numeric, 2), 'high_utilization_count', COUNT(*) FILTER (WHERE utilization_percent > 80), 'total_cables', COUNT(*)) FROM public.v_cable_utilization),
        'user_activity_last_30_days', (SELECT jsonb_agg(jsonb_build_object('date', day::date, 'count', COALESCE(activity_count, 0)) ORDER BY day) FROM generate_series(CURRENT_DATE - interval '29 days', CURRENT_DATE, '1 day') as s(day) LEFT JOIN (SELECT created_at::date as activity_date, COUNT(*) as activity_count FROM public.user_activity_logs WHERE created_at >= CURRENT_DATE - interval '29 days' GROUP BY activity_date) as activity ON s.day = activity.activity_date),
        'systems_per_maintenance_area', (SELECT jsonb_object_agg(ma.name, s.system_count) FROM (SELECT maintenance_terminal_id, COUNT(id) as system_count FROM public.systems WHERE maintenance_terminal_id IS NOT NULL GROUP BY maintenance_terminal_id) as s JOIN public.maintenance_areas ma ON s.maintenance_terminal_id = ma.id)
    ) INTO result;
    RETURN result;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_dashboard_overview() TO authenticated;


-- Generic function to get total, active, and inactive counts for any table/view.
CREATE OR REPLACE FUNCTION public.get_entity_counts(
    p_entity_name TEXT,
    p_filters JSONB DEFAULT '{}'
)
RETURNS TABLE (total_count BIGINT, active_count BIGINT, inactive_count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    sql_query TEXT;
    sql_where TEXT := 'WHERE 1=1';
    filter_key TEXT;
    filter_value JSONB;
BEGIN
    IF p_filters IS NOT NULL AND jsonb_typeof(p_filters) = 'object' AND p_filters != '{}'::jsonb THEN
        FOR filter_key, filter_value IN SELECT * FROM jsonb_each(p_filters)
        LOOP
            sql_where := sql_where || format(' AND %I = %L', filter_key, trim(both '"' from filter_value::text));
        END LOOP;
    END IF;

    sql_query := format(
        'SELECT count(*), count(*) FILTER (WHERE status = true), count(*) FILTER (WHERE status = false) FROM %I %s',
        p_entity_name, sql_where
    );
    RETURN QUERY EXECUTE sql_query;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_entity_counts(TEXT, JSONB) TO authenticated;


-- =================================================================
-- Section 2: Generic Pagination Functions
-- =================================================================
-- These functions build dynamic SQL. They are constructed to be secure
-- using format() with %I for identifiers and %L for literals.

-- Helper function to build the WHERE clause dynamically from a JSONB object.
CREATE OR REPLACE FUNCTION internal.build_where_clause(p_filters JSONB)
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  where_clause TEXT := '';
  filter_key TEXT;
  filter_value TEXT;
BEGIN
    IF p_filters IS NOT NULL AND jsonb_typeof(p_filters) = 'object' AND p_filters != '{}'::jsonb THEN
        FOR filter_key, filter_value IN SELECT key, value FROM jsonb_each_text(p_filters) LOOP
            IF filter_value IS NOT NULL AND filter_value != '' THEN
                -- Exact match for keys ending in '_id' or for boolean values
                IF right(filter_key, 3) = '_id' OR (filter_value IN ('true', 'false')) THEN
                    where_clause := where_clause || format(' AND v.%I::text = %L', filter_key, filter_value);
                ELSE
                    where_clause := where_clause || format(' AND v.%I::text ILIKE %L', filter_key, '%' || filter_value || '%');
                END IF;
            END IF;
        END LOOP;
    END IF;
    RETURN where_clause;
END;
$$;


-- Paged function for v_nodes_complete
CREATE OR REPLACE FUNCTION public.get_paged_nodes_complete(
    p_limit INT, p_offset INT, p_order_by TEXT DEFAULT 'name', p_order_dir TEXT DEFAULT 'asc', p_filters JSONB DEFAULT '{}'
) RETURNS TABLE(
    id UUID, name TEXT, created_at TIMESTAMPTZ, latitude NUMERIC, longitude NUMERIC,
    maintenance_area_name TEXT, node_type_name TEXT, remark TEXT, status BOOLEAN, updated_at TIMESTAMPTZ,
    total_count BIGINT, active_count BIGINT, inactive_count BIGINT
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY EXECUTE format(
    $query$
    SELECT v.id, v.name, v.created_at, v.latitude, v.longitude, v.maintenance_area_name, v.node_type_name, v.remark, v.status, v.updated_at,
      count(*) OVER() AS total_count,
      sum(CASE WHEN v.status THEN 1 ELSE 0 END) OVER() AS active_count,
      sum(CASE WHEN NOT v.status THEN 1 ELSE 0 END) OVER() AS inactive_count
    FROM public.v_nodes_complete v WHERE 1=1 %s ORDER BY v.%I %s LIMIT %L OFFSET %L
    $query$, internal.build_where_clause(p_filters), p_order_by, p_order_dir, p_limit, p_offset);
END; $$;
GRANT EXECUTE ON FUNCTION public.get_paged_nodes_complete(INT, INT, TEXT, TEXT, JSONB) TO authenticated;

-- Paged function for v_ofc_cables_complete
CREATE OR REPLACE FUNCTION public.get_paged_ofc_cables_complete(
    p_limit INT, p_offset INT, p_order_by TEXT DEFAULT 'route_name', p_order_dir TEXT DEFAULT 'asc', p_filters JSONB DEFAULT '{}'
) RETURNS TABLE(
    id UUID, route_name TEXT, sn_name TEXT, en_name TEXT, capacity INT, ofc_type_name TEXT,
    ofc_owner_name TEXT, current_rkm NUMERIC, maintenance_area_name TEXT, commissioned_on DATE, status BOOLEAN, remark TEXT, updated_at TIMESTAMPTZ,
    total_count BIGINT, active_count BIGINT, inactive_count BIGINT
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY EXECUTE format(
    $query$
    SELECT v.id, v.route_name, v.sn_name, v.en_name, v.capacity, v.ofc_type_name, v.ofc_owner_name, v.current_rkm,
           v.maintenance_area_name, v.commissioned_on, v.status, v.remark, v.updated_at,
           count(*) OVER() AS total_count, sum(CASE WHEN v.status THEN 1 ELSE 0 END) OVER() AS active_count,
           sum(CASE WHEN NOT v.status THEN 1 ELSE 0 END) OVER() AS inactive_count
    FROM public.v_ofc_cables_complete v WHERE 1=1 %s ORDER BY v.%I %s LIMIT %L OFFSET %L
    $query$, internal.build_where_clause(p_filters), p_order_by, p_order_dir, p_limit, p_offset);
END; $$;
GRANT EXECUTE ON FUNCTION public.get_paged_ofc_cables_complete(INT, INT, TEXT, TEXT, JSONB) TO authenticated;

-- Paged function for v_ofc_connections_complete
CREATE OR REPLACE FUNCTION public.get_paged_ofc_connections_complete(
    p_limit INT, p_offset INT, p_order_by TEXT DEFAULT 'fiber_no_sn', p_order_dir TEXT DEFAULT 'asc', p_filters JSONB DEFAULT '{}'
) RETURNS TABLE(
    id UUID, ofc_route_name TEXT, fiber_no_sn INT, sn_name TEXT, system_name TEXT, en_name TEXT, fiber_role TEXT, status BOOLEAN,
    total_count BIGINT, active_count BIGINT, inactive_count BIGINT
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY EXECUTE format(
    $query$
    SELECT v.id, v.ofc_route_name, v.fiber_no_sn, v.sn_name, v.system_name, v.en_name, v.fiber_role, v.status,
           count(*) OVER() AS total_count, sum(CASE WHEN v.status THEN 1 ELSE 0 END) OVER() AS active_count,
           sum(CASE WHEN NOT v.status THEN 1 ELSE 0 END) OVER() AS inactive_count
    FROM public.v_ofc_connections_complete v WHERE 1=1 %s ORDER BY v.%I %s LIMIT %L OFFSET %L
    $query$, internal.build_where_clause(p_filters), p_order_by, p_order_dir, p_limit, p_offset);
END; $$;
GRANT EXECUTE ON FUNCTION public.get_paged_ofc_connections_complete(INT, INT, TEXT, TEXT, JSONB) TO authenticated;

-- Paged function for v_systems_complete
CREATE OR REPLACE FUNCTION public.get_paged_systems_complete(
    p_limit INT, p_offset INT, p_order_by TEXT DEFAULT 'system_name', p_order_dir TEXT DEFAULT 'asc', p_filters JSONB DEFAULT '{}'
) RETURNS TABLE(
    id UUID, system_name TEXT, system_type_name TEXT, node_name TEXT, ip_address INET, status BOOLEAN, remark TEXT,
    total_count BIGINT, active_count BIGINT, inactive_count BIGINT
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY EXECUTE format(
    $query$
    SELECT v.id, v.system_name, v.system_type_name, v.node_name, v.ip_address, v.status, v.remark,
           count(*) OVER() AS total_count, sum(CASE WHEN v.status THEN 1 ELSE 0 END) OVER() AS active_count,
           sum(CASE WHEN NOT v.status THEN 1 ELSE 0 END) OVER() AS inactive_count
    FROM public.v_systems_complete v WHERE 1=1 %s ORDER BY v.%I %s LIMIT %L OFFSET %L
    $query$, internal.build_where_clause(p_filters), p_order_by, p_order_dir, p_limit, p_offset);
END; $$;
GRANT EXECUTE ON FUNCTION public.get_paged_systems_complete(INT, INT, TEXT, TEXT, JSONB) TO authenticated;

-- Paged function for v_system_connections_complete
CREATE OR REPLACE FUNCTION public.get_paged_system_connections_complete(
    p_limit INT, p_offset INT, p_order_by TEXT DEFAULT 'system_name', p_order_dir TEXT DEFAULT 'asc', p_filters JSONB DEFAULT '{}'
) RETURNS TABLE(
    id UUID, system_name TEXT, system_type_name TEXT, media_type_name TEXT, sn_name TEXT, sn_node_name TEXT,
    en_name TEXT, en_node_name TEXT, connected_system_name TEXT, status BOOLEAN,
    total_count BIGINT, active_count BIGINT, inactive_count BIGINT
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY EXECUTE format(
    $query$
    SELECT v.id, v.system_name, v.system_type_name, v.media_type_name, v.sn_name, v.sn_node_name, v.en_name, v.en_node_name, v.connected_system_name, v.status,
           count(*) OVER() AS total_count, sum(CASE WHEN v.status THEN 1 ELSE 0 END) OVER() AS active_count,
           sum(CASE WHEN NOT v.status THEN 1 ELSE 0 END) OVER() AS inactive_count
    FROM public.v_system_connections_complete v WHERE 1=1 %s ORDER BY v.%I %s LIMIT %L OFFSET %L
    $query$, internal.build_where_clause(p_filters), p_order_by, p_order_dir, p_limit, p_offset);
END; $$;
GRANT EXECUTE ON FUNCTION public.get_paged_system_connections_complete(INT, INT, TEXT, TEXT, JSONB) TO authenticated;

-- Paged function for v_lookup_types_with_count
CREATE OR REPLACE FUNCTION public.get_paged_lookup_types_with_count(
    p_limit INT, p_offset INT, p_order_by TEXT DEFAULT 'name', p_order_dir TEXT DEFAULT 'asc', p_filters JSONB DEFAULT '{}'
) RETURNS TABLE(
    id UUID, category TEXT, name TEXT, code TEXT, description TEXT, sort_order INT, status BOOLEAN,
    total_count BIGINT, active_count BIGINT, inactive_count BIGINT
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY EXECUTE format(
    $query$
    SELECT v.id, v.category, v.name, v.code, v.description, v.sort_order, v.status,
           count(*) OVER() AS total_count, sum(CASE WHEN v.status THEN 1 ELSE 0 END) OVER() AS active_count,
           sum(CASE WHEN NOT v.status THEN 1 ELSE 0 END) OVER() AS inactive_count
    FROM public.v_lookup_types_with_count v WHERE 1=1 %s ORDER BY v.%I %s LIMIT %L OFFSET %L
    $query$, internal.build_where_clause(p_filters), p_order_by, p_order_dir, p_limit, p_offset);
END; $$;
GRANT EXECUTE ON FUNCTION public.get_paged_lookup_types_with_count(INT, INT, TEXT, TEXT, JSONB) TO authenticated;

-- Paged function for v_maintenance_areas_with_count
CREATE OR REPLACE FUNCTION public.get_paged_maintenance_areas_with_count(
    p_limit INT, p_offset INT, p_order_by TEXT DEFAULT 'name', p_order_dir TEXT DEFAULT 'asc', p_filters JSONB DEFAULT '{}'
) RETURNS TABLE(
    id UUID, name TEXT, code TEXT, maintenance_area_type_name TEXT, contact_person TEXT, contact_number TEXT, status BOOLEAN,
    total_count BIGINT, active_count BIGINT, inactive_count BIGINT
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY EXECUTE format(
    $query$
    SELECT v.id, v.name, v.code, v.maintenance_area_type_name, v.contact_person, v.contact_number, v.status,
           count(*) OVER() AS total_count, sum(CASE WHEN v.status THEN 1 ELSE 0 END) OVER() AS active_count,
           sum(CASE WHEN NOT v.status THEN 1 ELSE 0 END) OVER() AS inactive_count
    FROM public.v_maintenance_areas_with_count v WHERE 1=1 %s ORDER BY v.%I %s LIMIT %L OFFSET %L
    $query$, internal.build_where_clause(p_filters), p_order_by, p_order_dir, p_limit, p_offset);
END; $$;
GRANT EXECUTE ON FUNCTION public.get_paged_maintenance_areas_with_count(INT, INT, TEXT, TEXT, JSONB) TO authenticated;

-- Paged function for v_employee_designations_with_count
CREATE OR REPLACE FUNCTION public.get_paged_employee_designations_with_count(
    p_limit INT, p_offset INT, p_order_by TEXT DEFAULT 'name', p_order_dir TEXT DEFAULT 'asc', p_filters JSONB DEFAULT '{}'
) RETURNS TABLE(
    id UUID, name TEXT, parent_id UUID, status BOOLEAN,
    total_count BIGINT, active_count BIGINT, inactive_count BIGINT
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY EXECUTE format(
    $query$
    SELECT v.id, v.name, v.parent_id, v.status,
           count(*) OVER() AS total_count, sum(CASE WHEN v.status THEN 1 ELSE 0 END) OVER() AS active_count,
           sum(CASE WHEN NOT v.status THEN 1 ELSE 0 END) OVER() AS inactive_count
    FROM public.v_employee_designations_with_count v WHERE 1=1 %s ORDER BY v.%I %s LIMIT %L OFFSET %L
    $query$, internal.build_where_clause(p_filters), p_order_by, p_order_dir, p_limit, p_offset);
END; $$;
GRANT EXECUTE ON FUNCTION public.get_paged_employee_designations_with_count(INT, INT, TEXT, TEXT, JSONB) TO authenticated;

-- Paged function for v_employees_with_count
CREATE OR REPLACE FUNCTION public.get_paged_employees_with_count(
    p_limit INT, p_offset INT, p_order_by TEXT DEFAULT 'employee_name', p_order_dir TEXT DEFAULT 'asc', p_filters JSONB DEFAULT '{}'
) RETURNS TABLE(
    id UUID, employee_name TEXT, employee_pers_no TEXT, employee_designation_name TEXT, employee_contact TEXT, status BOOLEAN,
    total_count BIGINT, active_count BIGINT, inactive_count BIGINT
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY EXECUTE format(
    $query$
    SELECT v.id, v.employee_name, v.employee_pers_no, v.employee_designation_name, v.employee_contact, v.status,
           count(*) OVER() AS total_count, sum(CASE WHEN v.status THEN 1 ELSE 0 END) OVER() AS active_count,
           sum(CASE WHEN NOT v.status THEN 1 ELSE 0 END) OVER() AS inactive_count
    FROM public.v_employees_with_count v WHERE 1=1 %s ORDER BY v.%I %s LIMIT %L OFFSET %L
    $query$, internal.build_where_clause(p_filters), p_order_by, p_order_dir, p_limit, p_offset);
END; $$;
GRANT EXECUTE ON FUNCTION public.get_paged_employees_with_count(INT, INT, TEXT, TEXT, JSONB) TO authenticated;

-- Paged function for v_rings_with_count
CREATE OR REPLACE FUNCTION public.get_paged_rings_with_count(
    p_limit INT, p_offset INT, p_order_by TEXT DEFAULT 'name', p_order_dir TEXT DEFAULT 'asc', p_filters JSONB DEFAULT '{}'
) RETURNS TABLE(
    id UUID, name TEXT, ring_type_name TEXT, maintenance_area_name TEXT, total_nodes INT, status BOOLEAN,
    total_count BIGINT, active_count BIGINT, inactive_count BIGINT
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY EXECUTE format(
    $query$
    SELECT v.id, v.name, v.ring_type_name, v.maintenance_area_name, v.total_nodes, v.status,
           count(*) OVER() AS total_count, sum(CASE WHEN v.status THEN 1 ELSE 0 END) OVER() AS active_count,
           sum(CASE WHEN NOT v.status THEN 1 ELSE 0 END) OVER() AS inactive_count
    FROM public.v_rings_with_count v WHERE 1=1 %s ORDER BY v.%I %s LIMIT %L OFFSET %L
    $query$, internal.build_where_clause(p_filters), p_order_by, p_order_dir, p_limit, p_offset);
END; $$;
GRANT EXECUTE ON FUNCTION public.get_paged_rings_with_count(INT, INT, TEXT, TEXT, JSONB) TO authenticated;


-- =================================================================
-- Section 3: Specialized Utility Functions (No Pagination)
-- =================================================================

-- Securely fetches the ordered segments for a specific logical path.
CREATE OR REPLACE FUNCTION public.get_system_path_details(p_path_id UUID)
RETURNS SETOF public.v_system_ring_paths_detailed
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Security Check: The user must have RLS permission to view the source system of the path.
    IF NOT EXISTS (
        SELECT 1 FROM public.logical_fiber_paths lfp
        WHERE lfp.id = p_path_id AND EXISTS (SELECT 1 FROM public.systems s WHERE s.id = lfp.source_system_id)
    ) THEN
        RETURN;
    END IF;
    -- If the check passes, return the detailed path segments.
    RETURN QUERY SELECT * FROM public.v_system_ring_paths_detailed
    WHERE logical_path_id = p_path_id ORDER BY path_order ASC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_system_path_details(UUID) TO authenticated;


-- Gets all available fibers that are continuous across all segments of a physical path.
CREATE OR REPLACE FUNCTION public.get_continuous_available_fibers(p_path_id UUID)
RETURNS TABLE(fiber_no INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    path_cable_count INT;
BEGIN
    -- Get the total number of unique physical cable segments in the path.
    SELECT COUNT(DISTINCT seg.ofc_cable_id) INTO path_cable_count
    FROM public.logical_path_segments seg
    WHERE seg.logical_path_id = p_path_id AND seg.ofc_cable_id IS NOT NULL;
    IF COALESCE(path_cable_count, 0) = 0 THEN RETURN; END IF;

    -- Find all fiber numbers that appear on exactly `path_cable_count` cables within the path.
    RETURN QUERY
    SELECT conn.fiber_no_sn::INT
    FROM public.ofc_connections conn
    JOIN public.logical_path_segments seg ON conn.ofc_id = seg.ofc_cable_id
    WHERE seg.logical_path_id = p_path_id
      AND conn.logical_path_id IS NULL -- Fiber must be unassigned
      AND conn.status = TRUE
    GROUP BY conn.fiber_no_sn
    HAVING COUNT(conn.ofc_id) = path_cable_count;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_continuous_available_fibers(UUID) TO authenticated;