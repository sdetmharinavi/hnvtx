-- path: data/migrations/06_utilities/04_dashboard_functions.sql
-- Description: Contains functions for dashboard aggregations with filtering support.

CREATE OR REPLACE FUNCTION public.get_dashboard_overview(
    p_status TEXT DEFAULT NULL,       -- 'active' or 'inactive'
    p_type TEXT DEFAULT NULL,         -- System/Cable Type Name
    p_region TEXT DEFAULT NULL,       -- Maintenance Area Name
    p_node_type TEXT DEFAULT NULL,    -- Node Type Name
    p_query TEXT DEFAULT NULL         -- General Search Query
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_jwt_role TEXT := auth.jwt() ->> 'role';
    v_is_super_admin BOOLEAN := public.is_super_admin();
    result jsonb;
    
    -- Filter Logic Helpers
    v_status_bool BOOLEAN;
BEGIN
    -- Parse status string to boolean for easier query usage
    IF p_status IS NOT NULL THEN
        v_status_bool := (p_status = 'active');
    END IF;

    SELECT jsonb_build_object(
        -- 1. System Counts (Filtered)
        'system_status_counts', (
            SELECT jsonb_object_agg(CASE WHEN s.status THEN 'Active' ELSE 'Inactive' END, count) 
            FROM (
                SELECT s.status, COUNT(*) as count 
                FROM public.v_systems_complete s
                WHERE 
                    (v_status_bool IS NULL OR s.status = v_status_bool) AND
                    (p_type IS NULL OR s.system_type_name = p_type) AND
                    (p_region IS NULL OR s.maintenance_area_name = p_region) AND
                    (p_node_type IS NULL OR s.node_type_name = p_node_type) AND
                    (p_query IS NULL OR s.system_name ILIKE '%' || p_query || '%')
                GROUP BY s.status
            ) as s
        ),

        -- 2. Node Counts (Filtered)
        'node_status_counts', (
            SELECT jsonb_object_agg(CASE WHEN n.status THEN 'Active' ELSE 'Inactive' END, count) 
            FROM (
                SELECT n.status, COUNT(*) as count 
                FROM public.v_nodes_complete n
                WHERE 
                    (v_status_bool IS NULL OR n.status = v_status_bool) AND
                    -- Node type filter applies directly
                    (p_node_type IS NULL OR n.node_type_name = p_node_type) AND
                    (p_region IS NULL OR n.maintenance_area_name = p_region) AND
                    (p_query IS NULL OR n.name ILIKE '%' || p_query || '%')
                GROUP BY n.status
            ) as n
        ),

        -- 3. Path Operational Status (Filtered by Region via Source System)
        'path_operational_status', (
            SELECT jsonb_object_agg(operational_status, count) 
            FROM (
                SELECT lfp.operational_status, COUNT(*) as count 
                FROM public.v_end_to_end_paths lfp
                -- Join systems to filter paths by region/type of the source system
                JOIN public.v_systems_complete src ON lfp.source_system_id = src.id
                WHERE 
                    (p_type IS NULL OR src.system_type_name = p_type) AND
                    (p_region IS NULL OR src.maintenance_area_name = p_region) AND
                    (p_query IS NULL OR lfp.path_name ILIKE '%' || p_query || '%')
                GROUP BY lfp.operational_status
            ) as p
        ),

        -- 4. Cable Utilization (Filtered)
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

        -- 5. Port Utilization Grouped by Type (Filtered)
        'port_utilization_by_type', (
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
                -- Join systems to filter ports by System properties
                JOIN public.v_systems_complete s ON pm.system_id = s.id
                WHERE 
                    (v_status_bool IS NULL OR s.status = v_status_bool) AND
                    (p_type IS NULL OR s.system_type_name = p_type) AND
                    (p_region IS NULL OR s.maintenance_area_name = p_region) AND
                    (p_node_type IS NULL OR s.node_type_name = p_node_type) AND
                    (p_query IS NULL OR s.system_name ILIKE '%' || p_query || '%')
                GROUP BY pm.port_type_code
            ) p
        )
    ) INTO result;

    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_dashboard_overview(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;