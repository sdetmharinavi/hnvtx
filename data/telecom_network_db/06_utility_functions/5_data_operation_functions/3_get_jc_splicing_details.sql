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


-- =================================================================
-- Step 2.2: Function to manage splices (create, delete)
-- A single function simplifies frontend logic.
-- =================================================================
CREATE OR REPLACE FUNCTION manage_splice(
    p_action TEXT, -- 'create' or 'delete'
    p_jc_id UUID,
    p_splice_id UUID DEFAULT NULL,
    p_incoming_cable_id UUID DEFAULT NULL,
    p_incoming_fiber_no INT DEFAULT NULL,
    p_outgoing_cable_id UUID DEFAULT NULL,
    p_outgoing_fiber_no INT DEFAULT NULL,
    p_splice_type TEXT DEFAULT 'pass_through'
)
RETURNS RECORD
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result RECORD;
BEGIN
    -- Security: Ensure user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF p_action = 'create' THEN
        -- Check if fibers are already used
        IF EXISTS (SELECT 1 FROM public.fiber_splices WHERE jc_id = p_jc_id AND incoming_cable_id = p_incoming_cable_id AND incoming_fiber_no = p_incoming_fiber_no) THEN
            RAISE EXCEPTION 'Incoming fiber is already in use in this JC.';
        END IF;

        IF p_outgoing_cable_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.fiber_splices WHERE jc_id = p_jc_id AND outgoing_cable_id = p_outgoing_cable_id AND outgoing_fiber_no = p_outgoing_fiber_no) THEN
            RAISE EXCEPTION 'Outgoing fiber is already in use in this JC.';
        END IF;

        -- Create the splice
        INSERT INTO public.fiber_splices (jc_id, incoming_cable_id, incoming_fiber_no, outgoing_cable_id, outgoing_fiber_no, splice_type)
        VALUES (p_jc_id, p_incoming_cable_id, p_incoming_fiber_no, p_outgoing_cable_id, p_outgoing_fiber_no, p_splice_type)
        RETURNING id, 'created' INTO result;

    ELSIF p_action = 'delete' THEN
        IF p_splice_id IS NULL THEN
            RAISE EXCEPTION 'Splice ID is required for delete action.';
        END IF;

        -- Delete the splice
        DELETE FROM public.fiber_splices WHERE id = p_splice_id AND jc_id = p_jc_id
        RETURNING id, 'deleted' INTO result;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Splice not found or you do not have permission to delete it.';
        END IF;
    ELSE
        RAISE EXCEPTION 'Invalid action specified. Use ''create'' or ''delete''.';
    END IF;

    RETURN result;
END;
$$;
