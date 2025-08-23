DROP FUNCTION IF EXISTS public.get_dashboard_overview;
CREATE OR REPLACE FUNCTION get_dashboard_overview()
RETURNS jsonb
SECURITY INVOKER
LANGUAGE plpgsql
AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_build_object(
        -- Chart 1: System Status Overview (e.g., for a Pie Chart)
        'system_status_counts', (
            SELECT jsonb_object_agg(
                CASE WHEN status THEN 'Active' ELSE 'Inactive' END,
                count
            )
            FROM (
                SELECT status, COUNT(*) as count
                FROM public.systems
                GROUP BY status
            ) as s
        ),

        -- Chart 2: Node Status Overview (e.g., for a Pie Chart)
        'node_status_counts', (
            SELECT jsonb_object_agg(
                CASE WHEN status THEN 'Active' ELSE 'Inactive' END,
                count
            )
            FROM (
                SELECT status, COUNT(*) as count
                FROM public.nodes
                GROUP BY status
            ) as n
        ),

        -- Chart 3: Fiber Path Health (e.g., for a Bar Chart)
        'path_operational_status', (
            SELECT jsonb_object_agg(operational_status, count)
            FROM (
                SELECT operational_status, COUNT(*) as count
                FROM public.logical_fiber_paths
                GROUP BY operational_status
            ) as p
        ),

        -- Chart 4: Cable Utilization Summary (e.g., for Gauges or KPIs)
        'cable_utilization_summary', (
            SELECT jsonb_build_object(
                'average_utilization_percent', ROUND(AVG(utilization_percent)::numeric, 2),
                'high_utilization_count', COUNT(*) FILTER (WHERE utilization_percent > 80),
                'total_cables', COUNT(*)
            )
            FROM public.v_cable_utilization
        ),

        -- Chart 5: Recent User Activity (e.g., for a Line Chart)
        'user_activity_last_30_days', (
            SELECT jsonb_agg(
                jsonb_build_object('date', day::date, 'count', COALESCE(activity_count, 0))
                ORDER BY day
            )
            FROM generate_series(
                CURRENT_DATE - interval '29 days',
                CURRENT_DATE,
                '1 day'
            ) as s(day)
            LEFT JOIN (
                SELECT created_at::date as activity_date, COUNT(*) as activity_count
                FROM public.user_activity_logs
                WHERE created_at >= CURRENT_DATE - interval '29 days'
                GROUP BY activity_date
            ) as activity ON s.day = activity.activity_date
        ),
        
        -- Chart 6: Systems by Maintenance Area (e.g., for a Bar Chart)
        'systems_per_maintenance_area', (
           SELECT jsonb_object_agg(ma.name, s.system_count)
           FROM (
               SELECT maintenance_terminal_id, COUNT(id) as system_count
               FROM public.systems
               WHERE maintenance_terminal_id IS NOT NULL
               GROUP BY maintenance_terminal_id
           ) as s
           JOIN public.maintenance_areas ma ON s.maintenance_terminal_id = ma.id
        )

    ) INTO result;

    RETURN result;
END;
$$;