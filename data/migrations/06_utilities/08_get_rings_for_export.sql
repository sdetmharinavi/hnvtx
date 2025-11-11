-- path: data/migrations/06_utilities/08_get_rings_for_export.sql
-- Description: Creates a function to export rings with a JSON array of associated systems including order and hub status.

CREATE OR REPLACE FUNCTION public.get_rings_for_export(
    row_limit INTEGER DEFAULT NULL,
    order_by TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    ring_type_name TEXT,
    maintenance_area_name TEXT,
    status BOOLEAN,
    total_nodes BIGINT,
    -- THE FIX: Changed from TEXT to JSONB for proper JSON formatting
    associated_systems JSONB
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
SELECT
    r.id,
    r.name,
    r.description,
    r.ring_type_name,
    r.maintenance_area_name,
    r.status,
    r.total_nodes,
    (
        -- THE FIX: Use JSON_AGG and JSON_BUILD_OBJECT to create the structured JSON array
        SELECT jsonb_agg(
            jsonb_build_object(
                'system', s.system_name,
                'order', rbs.order_in_ring,
                'is_hub', s.is_hub
            ) ORDER BY rbs.order_in_ring
        )
        FROM public.ring_based_systems rbs
        JOIN public.systems s ON rbs.system_id = s.id
        WHERE rbs.ring_id = r.id
    ) AS associated_systems
FROM
    public.v_rings r;
$$;

-- Grant execution permission on the updated function signature
GRANT EXECUTE ON FUNCTION public.get_rings_for_export(INTEGER, TEXT) TO authenticated;