-- This function evolves a simple ofc_cable into a segmented logical_fiber_path
-- when the first Junction Closure is added.
CREATE OR REPLACE FUNCTION public.evolve_cable_with_jc(
    p_cable_id UUID,
    p_jc_id UUID
)
RETURNS UUID -- Returns the ID of the new logical_fiber_path
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_logical_path_id UUID;
    v_cable RECORD;
    v_jc RECORD;
BEGIN
    -- 1. Get cable and JC details
    SELECT * INTO v_cable FROM public.ofc_cables WHERE id = p_cable_id;
    SELECT * INTO v_jc FROM public.junction_closures WHERE id = p_jc_id;

    IF v_cable IS NULL OR v_jc IS NULL THEN
        RAISE EXCEPTION 'Cable or Junction Closure not found';
    END IF;

    -- 2. Create a new Logical Fiber Path to represent the original A to B route
    INSERT INTO public.logical_fiber_paths (path_name, source_system_id, destination_system_id, total_distance_km, path_type_id)
    VALUES (
        v_cable.route_name || ' (Path)',
        v_cable.sn_id, -- Using start/end nodes as placeholders for systems
        v_cable.en_id,
        v_cable.current_rkm,
        (SELECT id FROM lookup_types WHERE category = 'OFC_PATH_TYPE' AND name = 'Main Route' LIMIT 1)
    ) RETURNING id INTO v_logical_path_id;

    -- 3. De-normalize the original ofc_connections into two new physical cables representing the segments
    --    This creates the "segment1_A-B" and "segment2_A-B" as physical entities.
    
    -- Segment 1: Start Node -> JC
    INSERT INTO public.ofc_cables (route_name, sn_id, en_id, ofc_type_id, capacity, ofc_owner_id, current_rkm, maintenance_terminal_id, status)
    VALUES (
        v_cable.route_name || ' | Seg 1: ' || v_cable.sn_id || '->' || v_jc.id,
        v_cable.sn_id,
        v_jc.id, -- The JC acts as the end node for this segment
        v_cable.ofc_type_id,
        v_cable.capacity,
        v_cable.ofc_owner_id,
        v_jc.position_km,
        v_cable.maintenance_terminal_id,
        true
    );

    -- Segment 2: JC -> End Node
    INSERT INTO public.ofc_cables (route_name, sn_id, en_id, ofc_type_id, capacity, ofc_owner_id, current_rkm, maintenance_terminal_id, status)
    VALUES (
        v_cable.route_name || ' | Seg 2: ' || v_jc.id || '->' || v_cable.en_id,
        v_jc.id, -- The JC acts as the start node for this segment
        v_cable.en_id,
        v_cable.ofc_type_id,
        v_cable.capacity,
        v_cable.ofc_owner_id,
        v_cable.current_rkm - v_jc.position_km,
        v_cable.maintenance_terminal_id,
        true
    );

    -- 4. Archive the original cable by marking it inactive.
    UPDATE public.ofc_cables SET status = false, remark = 'Archived. Evolved into segmented path ' || v_logical_path_id WHERE id = v_cable.id;

    -- 5. Create default "straight-through" splices in the JC for all fibers
    -- This assumes the new segments are now distinct cables in the DB.
    FOR i IN 1..v_cable.capacity LOOP
        INSERT INTO public.fiber_splices(jc_id, incoming_cable_id, incoming_fiber_no, outgoing_cable_id, outgoing_fiber_no, logical_path_id)
        VALUES(p_jc_id, (SELECT id FROM ofc_cables WHERE en_id = v_jc.id), i, (SELECT id FROM ofc_cables WHERE sn_id = v_jc.id), i, v_logical_path_id);
    END LOOP;

    RETURN v_logical_path_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.evolve_cable_with_jc(UUID, UUID) TO authenticated;