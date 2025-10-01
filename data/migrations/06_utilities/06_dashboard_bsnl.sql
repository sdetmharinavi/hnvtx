-- path: migrations/06_utilities/06_dashboard_bsnl.sql
-- Description: Creates a unified function to fetch all necessary data for the BSNL dashboard in a single query.

CREATE OR REPLACE FUNCTION public.get_bsnl_dashboard_data(
    p_node_types TEXT[] DEFAULT NULL,
    p_system_types TEXT[] DEFAULT NULL,
    p_cable_types TEXT[] DEFAULT NULL,
    p_regions TEXT[] DEFAULT NULL,
    p_status BOOLEAN DEFAULT NULL,
    p_query TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    nodes_json JSONB;
    cables_json JSONB;
    systems_json JSONB;
BEGIN
    -- Fetch Nodes
    SELECT jsonb_agg(n)
    INTO nodes_json
    FROM public.v_nodes_complete n
    WHERE (p_status IS NULL OR n.status = p_status)
      AND (p_node_types IS NULL OR n.node_type_name = ANY(p_node_types));

    -- Fetch Cables
    SELECT jsonb_agg(c)
    INTO cables_json
    FROM public.v_ofc_cables_complete c
    WHERE (p_status IS NULL OR c.status = p_status)
      AND (p_cable_types IS NULL OR c.ofc_type_name = ANY(p_cable_types))
      AND (p_regions IS NULL OR c.maintenance_area_name = ANY(p_regions))
      AND (p_query IS NULL OR c.route_name ILIKE ('%' || p_query || '%') OR c.asset_no ILIKE ('%' || p_query || '%'));

    -- Fetch Systems
    SELECT jsonb_agg(s)
    INTO systems_json
    FROM public.v_systems_complete s
    WHERE (p_status IS NULL OR s.status = p_status)
      AND (p_system_types IS NULL OR s.system_type_name = ANY(p_system_types))
      AND (p_regions IS NULL OR s.system_maintenance_terminal_name = ANY(p_regions))
      AND (p_query IS NULL OR s.system_name ILIKE ('%' || p_query || '%') OR s.node_name ILIKE ('%' || p_query || '%'));
      
    -- Combine results into a single JSON object
    RETURN jsonb_build_object(
        'nodes', COALESCE(nodes_json, '[]'::jsonb),
        'ofcCables', COALESCE(cables_json, '[]'::jsonb),
        'systems', COALESCE(systems_json, '[]'::jsonb)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_bsnl_dashboard_data(TEXT[], TEXT[], TEXT[], TEXT[], BOOLEAN, TEXT) TO authenticated;