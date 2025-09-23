-- Path: migrations/06_utilities/04_dashboard_functions.sql
-- Description: Contains functions for dashboard aggregations and a complete set of explicit pagination functions for all major views.

-- =================================================================
-- Section 1: Dashboard and Aggregation Functions
-- =================================================================

CREATE OR REPLACE FUNCTION public.get_dashboard_overview()
RETURNS JSONB LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE result jsonb;
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
END; $$;
GRANT EXECUTE ON FUNCTION public.get_dashboard_overview() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_entity_counts(p_entity_name TEXT, p_filters JSONB DEFAULT '{}')
RETURNS TABLE (total_count BIGINT, active_count BIGINT, inactive_count BIGINT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE sql_query TEXT; sql_where TEXT := 'WHERE 1=1'; filter_key TEXT; filter_value JSONB;
BEGIN
    IF p_filters IS NOT NULL AND jsonb_typeof(p_filters) = 'object' AND p_filters != '{}'::jsonb THEN
        FOR filter_key, filter_value IN SELECT * FROM jsonb_each(p_filters) LOOP
            sql_where := sql_where || format(' AND %I = %L', filter_key, trim(both '"' from filter_value::text));
        END LOOP;
    END IF;
    sql_query := format('SELECT count(*), count(*) FILTER (WHERE status = true), count(*) FILTER (WHERE status = false) FROM %I %s', p_entity_name, sql_where);
    RETURN QUERY EXECUTE sql_query;
END; $$;
GRANT EXECUTE ON FUNCTION public.get_entity_counts(TEXT, JSONB) TO authenticated;

