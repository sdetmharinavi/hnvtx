-- path: data/migrations/06_utilities/04_dashboard_functions.sql
-- Description: Contains functions for dashboard aggregations with filtering support.

CREATE OR REPLACE FUNCTION public.get_dashboard_overview(
    p_status TEXT DEFAULT NULL,
    p_type TEXT DEFAULT NULL,
    p_region TEXT DEFAULT NULL,
    p_node_type TEXT DEFAULT NULL,
    p_query TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_jwt_role TEXT := auth.jwt() ->> 'role';
    v_is_super_admin BOOLEAN := public.is_super_admin();
    result jsonb;
    v_status_bool BOOLEAN;
    v_user_activity jsonb;
BEGIN
    IF p_status IS NOT NULL THEN
        v_status_bool := (p_status = 'active');
    END IF;

    -- Handle User Activity (Admin Only)
    IF (v_jwt_role = 'admin' OR v_is_super_admin) AND EXISTS (
        SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_activity_logs'
    ) THEN
        SELECT jsonb_agg(jsonb_build_object('date', day::date, 'count', COALESCE(activity_count, 0)) ORDER BY day)
        INTO v_user_activity
        FROM generate_series(CURRENT_DATE - interval '29 days', CURRENT_DATE, '1 day') as s(day)
        LEFT JOIN (
            SELECT created_at::date as activity_date, COUNT(*) as activity_count
            FROM public.user_activity_logs
            WHERE created_at >= CURRENT_DATE - interval '29 days'
            GROUP BY activity_date
        ) as activity ON s.day = activity.activity_date;
    ELSE
        v_user_activity := '[]'::jsonb;
    END IF;

    SELECT jsonb_build_object(
        'system_status_counts', COALESCE((
            SELECT jsonb_object_agg(CASE WHEN s.status THEN 'Active' ELSE 'Inactive' END, count) 
            FROM (
                SELECT s.status, COUNT(*) as count 
                FROM public.v_systems_complete s
                WHERE 
                    (v_status_bool IS NULL OR s.status = v_status_bool) AND
                    (p_type IS NULL OR s.system_type_name = p_type) AND
                    (p_region IS NULL OR s.system_maintenance_terminal_name = p_region) AND
                    (p_node_type IS NULL OR s.node_type_name = p_node_type) AND
                    (p_query IS NULL OR s.system_name ILIKE '%' || p_query || '%')
                GROUP BY s.status
            ) as s
        ), '{}'::jsonb),

        'node_status_counts', COALESCE((
            SELECT jsonb_object_agg(CASE WHEN n.status THEN 'Active' ELSE 'Inactive' END, count) 
            FROM (
                SELECT n.status, COUNT(*) as count 
                FROM public.v_nodes_complete n
                WHERE 
                    (v_status_bool IS NULL OR n.status = v_status_bool) AND
                    (p_node_type IS NULL OR n.node_type_name = p_node_type) AND
                    (p_region IS NULL OR n.maintenance_area_name = p_region) AND
                    (p_query IS NULL OR n.name ILIKE '%' || p_query || '%')
                GROUP BY n.status
            ) as n
        ), '{}'::jsonb),

        'path_operational_status', COALESCE((
            SELECT jsonb_object_agg(operational_status, count) 
            FROM (
                SELECT lfp.operational_status, COUNT(*) as count 
                FROM public.v_end_to_end_paths lfp
                JOIN public.v_systems_complete src ON lfp.source_system_id = src.id
                WHERE 
                    (p_type IS NULL OR src.system_type_name = p_type) AND
                    (p_region IS NULL OR src.system_maintenance_terminal_name = p_region) AND
                    (p_query IS NULL OR lfp.path_name ILIKE '%' || p_query || '%')
                GROUP BY lfp.operational_status
            ) as p
        ), '{}'::jsonb),

        'cable_utilization_summary', (
            SELECT jsonb_build_object(
                'average_utilization_percent', COALESCE(ROUND(AVG(u.utilization_percent)::numeric, 2), 0),
                'high_utilization_count', COUNT(*) FILTER (WHERE u.utilization_percent > 80),
                'total_cables', COUNT(*)
            ) 
            FROM public.v_cable_utilization u
            JOIN public.v_ofc_cables_complete c ON u.cable_id = c.id
            WHERE
                (v_status_bool IS NULL OR c.status = v_status_bool) AND
                (p_type IS NULL OR c.ofc_type_name = p_type) AND
                (p_region IS NULL OR c.maintenance_area_name = p_region) AND
                (p_query IS NULL OR c.route_name ILIKE '%' || p_query || '%')
        ),

        'port_utilization_by_type', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'type_code', p.port_type_code,
                'total', p.count,
                'active', p.active,
                'used', p.used
            ))
            FROM (
                SELECT 
                    pm.port_type_code,
                    COUNT(*) as count,
                    COUNT(*) FILTER (WHERE pm.port_admin_status = true) as active,
                    COUNT(*) FILTER (WHERE pm.port_utilization = true) as used
                FROM public.v_ports_management_complete pm
                JOIN public.v_systems_complete s ON pm.system_id = s.id
                WHERE 
                    (v_status_bool IS NULL OR s.status = v_status_bool) AND
                    (p_type IS NULL OR s.system_type_name = p_type) AND
                    (p_region IS NULL OR s.maintenance_area_name = p_region) AND
                    (p_node_type IS NULL OR s.node_type_name = p_node_type) AND
                    (p_query IS NULL OR s.system_name ILIKE '%' || p_query || '%')
                GROUP BY pm.port_type_code
            ) p
        ), '[]'::jsonb),

        'user_activity_last_30_days', v_user_activity,

        'systems_per_maintenance_area', COALESCE((
            SELECT jsonb_object_agg(ma.name, s.system_count) 
            FROM (
                SELECT maintenance_terminal_id, COUNT(id) as system_count 
                FROM public.systems 
                WHERE maintenance_terminal_id IS NOT NULL 
                GROUP BY maintenance_terminal_id
            ) as s 
            JOIN public.maintenance_areas ma ON s.maintenance_terminal_id = ma.id
        ), '{}'::jsonb)
    ) INTO result;

    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_dashboard_overview(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;