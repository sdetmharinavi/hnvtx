-- path: data/migrations/06_utilities/06_bsnl_dashboard_data.sql
-- Description: Creates a centralized RPC function to fetch filtered data for the BSNL dashboard.

CREATE OR REPLACE FUNCTION public.get_bsnl_dashboard_data(
    p_query TEXT DEFAULT NULL,
    p_status BOOLEAN DEFAULT NULL,
    p_system_types TEXT[] DEFAULT NULL,
    p_cable_types TEXT[] DEFAULT NULL,
    p_regions TEXT[] DEFAULT NULL,
    p_node_types TEXT[] DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- THE FIX: Running as the function owner (postgres) to bypass RLS issues.
STABLE
AS $$
DECLARE
    v_jwt_role TEXT := auth.jwt() ->> 'role';
    v_allowed_roles TEXT[] := ARRAY['admin', 'viewer', 'cpan_admin', 'maan_admin', 'sdh_admin', 'asset_admin', 'mng_admin'];
    v_nodes JSONB;
    v_ofc_cables JSONB;
    v_systems JSONB;
    search_query TEXT := '%' || p_query || '%';
BEGIN
    -- SECURITY CHECK: Manually enforce role-based access since SECURITY DEFINER bypasses RLS.
    IF NOT (v_jwt_role = ANY(v_allowed_roles)) THEN
        RAISE EXCEPTION 'Permission denied: Your role does not have access to this resource.';
    END IF;

    -- Queries will now run as the 'postgres' user and will bypass any RLS policies.
    -- The security check above is now the gatekeeper.

    -- 1. Fetch Nodes
    SELECT COALESCE(jsonb_agg(n), '[]'::jsonb)
    INTO v_nodes
    FROM public.v_nodes_complete n
    WHERE
        (p_query IS NULL OR (n.name ILIKE search_query OR n.remark ILIKE search_query OR n.maintenance_area_name ILIKE search_query)) AND
        (p_status IS NULL OR n.status = p_status) AND
        (p_regions IS NULL OR n.maintenance_area_name = ANY(p_regions)) AND
        (p_node_types IS NULL OR n.node_type_name = ANY(p_node_types));

    -- 2. Fetch OFC Cables
    SELECT COALESCE(jsonb_agg(c), '[]'::jsonb)
    INTO v_ofc_cables
    FROM public.v_ofc_cables_complete c
    WHERE
        (p_query IS NULL OR (c.route_name ILIKE search_query OR c.asset_no ILIKE search_query OR c.sn_name ILIKE search_query OR c.en_name ILIKE search_query)) AND
        (p_status IS NULL OR c.status = p_status) AND
        (p_regions IS NULL OR c.maintenance_area_name = ANY(p_regions)) AND
        (p_cable_types IS NULL OR c.ofc_type_name = ANY(p_cable_types));

    -- 3. Fetch Systems
    SELECT COALESCE(jsonb_agg(s), '[]'::jsonb)
    INTO v_systems
    FROM public.v_systems_complete s
    WHERE
        (p_query IS NULL OR (s.system_name ILIKE search_query OR s.node_name ILIKE search_query OR s.ip_address::TEXT ILIKE search_query)) AND
        (p_status IS NULL OR s.status = p_status) AND
        (p_regions IS NULL OR s.system_maintenance_terminal_name = ANY(p_regions)) AND
        (p_system_types IS NULL OR s.system_type_name = ANY(p_system_types));

    -- 4. Construct and return the final JSON object
    RETURN jsonb_build_object(
        'nodes', v_nodes,
        'ofcCables', v_ofc_cables,
        'systems', v_systems
    );
END;
$$;

-- Grant execute permission to the authenticated role
GRANT EXECUTE ON FUNCTION public.get_bsnl_dashboard_data(TEXT, BOOLEAN, TEXT[], TEXT[], TEXT[], TEXT[]) TO authenticated;