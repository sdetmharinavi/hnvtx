-- path: data/migrations/04_advanced_ofc/07_get_route_topology.sql
-- Description: Creates a function to export the entire topology of a given OFC route.

CREATE OR REPLACE FUNCTION public.get_route_topology_for_export(p_route_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_junction_closures JSONB;
    v_cable_segments JSONB;
    v_fiber_splices JSONB;
BEGIN
    -- 1. Get all junction closures for the route
    -- THE FIX: Changed alias from 'jc_id' to 'id' to match the table schema.
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', jc.id,
        'node_id', jc.node_id,
        'node_name', n.name,
        'position_km', jc.position_km
      )
    ), '[]'::jsonb)
    INTO v_junction_closures
    FROM public.junction_closures jc
    JOIN public.nodes n ON jc.node_id = n.id
    WHERE jc.ofc_cable_id = p_route_id;

    -- 2. Get all cable segments for the route (This was already correct)
    SELECT COALESCE(jsonb_agg(cs), '[]'::jsonb)
    INTO v_cable_segments
    FROM public.cable_segments cs
    WHERE cs.original_cable_id = p_route_id;

    -- 3. Get all fiber splices within the JCs of this route (This was already correct)
    SELECT COALESCE(jsonb_agg(fs), '[]'::jsonb)
    INTO v_fiber_splices
    FROM public.fiber_splices fs
    WHERE fs.jc_id IN (SELECT id FROM public.junction_closures WHERE ofc_cable_id = p_route_id);

    -- 4. Combine into a single JSON object
    RETURN jsonb_build_object(
        'junction_closures', v_junction_closures,
        'cable_segments', v_cable_segments,
        'fiber_splices', v_fiber_splices
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_route_topology_for_export(UUID) TO authenticated;