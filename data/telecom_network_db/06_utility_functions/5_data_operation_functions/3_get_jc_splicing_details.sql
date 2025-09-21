-- =================================================================
-- Step 2.1: Function to get all data needed for the Splice Matrix UI
-- This function is the primary data source for our new Route Manager UI.
-- =================================================================
-- path: functions/get_jc_splicing_details_v2.sql

CREATE OR REPLACE FUNCTION get_jc_splicing_details(p_jc_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    WITH connected_cables AS (
        SELECT DISTINCT cable_id FROM (
            -- 1. Get cables already involved in a splice at this JC
            SELECT incoming_cable_id as cable_id FROM public.fiber_splices WHERE jc_id = p_jc_id
            UNION
            SELECT outgoing_cable_id as cable_id FROM public.fiber_splices WHERE jc_id = p_jc_id AND outgoing_cable_id IS NOT NULL
            UNION
            -- 2. KEY CHANGE: Always include the JC's parent cable, even if no splices exist yet
            SELECT ofc_cable_id as cable_id FROM public.junction_closures WHERE id = p_jc_id AND ofc_cable_id IS NOT NULL
        ) AS cables
    ),
    cables_with_fibers AS (
        SELECT
            c.id AS cable_id, c.route_name, c.capacity,
            sn.name as start_node_name, en.name as end_node_name,
            generate_series(1, c.capacity) AS fiber_no
        FROM public.ofc_cables c
        JOIN connected_cables cc ON c.id = cc.cable_id
        LEFT JOIN public.nodes sn ON c.sn_id = sn.id
        LEFT JOIN public.nodes en ON c.en_id = en.id
    ),
    fiber_splice_info AS (
        SELECT
            cf.cable_id, cf.route_name, cf.start_node_name, cf.end_node_name, cf.capacity, cf.fiber_no,
            inc_splice.id AS splice_id,
            inc_splice.outgoing_cable_id, inc_splice.outgoing_fiber_no, out_cable.route_name AS outgoing_route_name,
            out_splice.id AS reflected_splice_id,
            out_splice.incoming_cable_id, out_splice.incoming_fiber_no, inc_cable.route_name as incoming_route_name,
            CASE
                WHEN inc_splice.splice_type = 'termination' THEN 'terminated'
                WHEN inc_splice.id IS NOT NULL THEN 'used_as_incoming'
                WHEN out_splice.id IS NOT NULL THEN 'used_as_outgoing'
                ELSE 'available'
            END as status,
            COALESCE(inc_splice.logical_path_id, out_splice.logical_path_id) as logical_path_id
        FROM cables_with_fibers cf
        LEFT JOIN public.fiber_splices inc_splice ON cf.cable_id = inc_splice.incoming_cable_id AND cf.fiber_no = inc_splice.incoming_fiber_no AND inc_splice.jc_id = p_jc_id
        LEFT JOIN public.fiber_splices out_splice ON cf.cable_id = out_splice.outgoing_cable_id AND cf.fiber_no = out_splice.outgoing_fiber_no AND out_splice.jc_id = p_jc_id
        LEFT JOIN public.ofc_cables out_cable ON inc_splice.outgoing_cable_id = out_cable.id
        LEFT JOIN public.ofc_cables inc_cable ON out_splice.incoming_cable_id = inc_cable.id
    )
    SELECT jsonb_build_object(
        'jc_details', (SELECT to_jsonb(jc.*) FROM public.junction_closures jc WHERE jc.id = p_jc_id),
        'cables', (
            SELECT jsonb_agg(DISTINCT jsonb_build_object(
                'cable_id', fsi.cable_id, 'route_name', fsi.route_name, 'capacity', fsi.capacity,
                'start_node', fsi.start_node_name, 'end_node', fsi.end_node_name,
                'fibers', (
                    SELECT jsonb_agg(jsonb_build_object(
                        'fiber_no', sub.fiber_no,
                        'status', sub.status,
                        'splice_id', COALESCE(sub.splice_id, sub.reflected_splice_id),
                        'connected_to_cable', COALESCE(sub.outgoing_route_name, sub.incoming_route_name),
                        'connected_to_fiber', COALESCE(sub.outgoing_fiber_no, sub.incoming_fiber_no)
                    ) ORDER BY sub.fiber_no)
                    FROM fiber_splice_info sub WHERE sub.cable_id = fsi.cable_id
                )
            ))
            FROM fiber_splice_info fsi
        )
    ) INTO result;

    RETURN result;
END;
$$;


