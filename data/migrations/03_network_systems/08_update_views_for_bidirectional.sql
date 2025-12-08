-- path: data/migrations/03_network_systems/08_update_views_for_bidirectional.sql
-- Description: No view change needed for the primary connection logic as RPC handles filtering.
-- However, we will ensure the RPC can filter by EITHER system_id OR en_id to show connections on both dashboards.

CREATE OR REPLACE FUNCTION public.get_paged_system_connections(
    p_system_id UUID,
    p_limit INT,
    p_offset INT,
    p_search_query TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_data JSONB;
    v_total BIGINT;
BEGIN
    SELECT jsonb_agg(t) INTO v_data
    FROM (
        SELECT * FROM public.v_system_connections_complete
        WHERE (system_id = p_system_id OR en_id = p_system_id) -- Show if Source OR Destination
          AND (
             p_search_query IS NULL OR 
             (service_name ILIKE '%' || p_search_query || '%' OR connected_system_name ILIKE '%' || p_search_query || '%')
          )
        ORDER BY created_at DESC
        LIMIT p_limit OFFSET p_offset
    ) t;

    SELECT COUNT(*) INTO v_total
    FROM public.v_system_connections_complete
    WHERE (system_id = p_system_id OR en_id = p_system_id)
      AND (
         p_search_query IS NULL OR 
         (service_name ILIKE '%' || p_search_query || '%' OR connected_system_name ILIKE '%' || p_search_query || '%')
      );

    RETURN jsonb_build_object(
        'data', COALESCE(v_data, '[]'::jsonb),
        'total_count', v_total
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_paged_system_connections(UUID, INT, INT, TEXT) TO authenticated;