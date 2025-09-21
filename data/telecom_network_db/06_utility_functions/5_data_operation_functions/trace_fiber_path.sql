-- path: functions/trace_fiber_path_v21_final_server_logic.sql

CREATE OR REPLACE FUNCTION trace_fiber_path(
    p_start_cable_id UUID,
    p_start_fiber_no INT
)
RETURNS TABLE (
    segment_order BIGINT,
    path_type TEXT,
    element_id UUID,
    element_name TEXT,
    details TEXT,
    fiber_no INT,
    distance_km NUMERIC,
    loss_db NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE path_traversal AS (
        -- ANCHOR: Start with the initial cable.
        SELECT
            1::BIGINT AS segment_order,
            p_start_cable_id AS current_cable_id,
            p_start_fiber_no AS current_fiber_no,
            0::NUMERIC AS last_position_km,
            (SELECT sn_id FROM ofc_cables WHERE id = p_start_cable_id) AS from_node_id,
            (SELECT en_id FROM ofc_cables WHERE id = p_start_cable_id) AS to_node_id

        UNION ALL

        -- RECURSIVE: Find the next splice and hop to the next cable.
        SELECT
            p.segment_order + 1,
            s.outgoing_cable_id,
            s.outgoing_fiber_no,
            jc.position_km,
            -- Determine the next 'from' and 'to' nodes for the new cable
            CASE
                WHEN next_cable.sn_id = jc.node_id THEN jc.node_id
                ELSE next_cable.en_id
            END,
            CASE
                WHEN next_cable.sn_id = jc.node_id THEN next_cable.en_id
                ELSE next_cable.sn_id
            END
        FROM path_traversal p
        JOIN public.fiber_splices s ON p.current_cable_id = s.incoming_cable_id AND p.current_fiber_no = s.incoming_fiber_no
        JOIN public.junction_closures jc ON s.jc_id = jc.id
        JOIN public.ofc_cables next_cable ON s.outgoing_cable_id = next_cable.id
        WHERE s.outgoing_cable_id IS NOT NULL
        AND p.segment_order < 50 -- Safety break
    )
    -- This final SELECT statement builds the full visual output from the traversal path.
    SELECT
        ROW_NUMBER() OVER (ORDER BY pt.segment_order, z.type_order) AS final_segment_order,
        z.path_type, z.element_id, z.element_name, z.details, z.fiber_no, z.distance_km, z.loss_db
    FROM path_traversal pt
    CROSS JOIN LATERAL (
        -- Row for the CABLE segment
        SELECT
            1 as type_order,
            'CABLE'::TEXT,
            pt.current_cable_id,
            c.route_name,
            (sn.name || ' → ' || en.name)::TEXT,
            pt.current_fiber_no,
            -- Calculate segment distance accurately
            COALESCE(
                (SELECT s_next.otdr_length_km FROM fiber_splices s_next WHERE s_next.incoming_cable_id = pt.current_cable_id AND s_next.incoming_fiber_no = pt.current_fiber_no),
                ABS(
                    (SELECT jc_next.position_km FROM junction_closures jc_next JOIN fiber_splices s_next ON jc_next.id = s_next.jc_id WHERE s_next.incoming_cable_id = pt.current_cable_id AND s_next.incoming_fiber_no = pt.current_fiber_no)
                    - pt.last_position_km
                )
            ),
            NULL::NUMERIC
        FROM public.ofc_cables c
        JOIN public.nodes sn ON c.sn_id = sn.id
        JOIN public.nodes en ON c.en_id = en.id
        WHERE c.id = pt.current_cable_id

        UNION ALL

        -- Row for the JC (if it exists)
        SELECT
            2 as type_order,
            'JC'::TEXT,
            s.jc_id,
            jc.name,
            'Splice'::TEXT,
            s.outgoing_fiber_no,
            NULL::NUMERIC,
            s.loss_db
        FROM public.fiber_splices s
        JOIN public.junction_closures jc ON s.jc_id = jc.id
        WHERE s.incoming_cable_id = pt.current_cable_id AND s.incoming_fiber_no = pt.current_fiber_no

    ) AS z
    WHERE z.element_id IS NOT NULL
    ORDER BY final_segment_order;
END;
$$;