-- path: functions/auto_splice_jc.sql

CREATE OR REPLACE FUNCTION auto_splice_straight(
    p_jc_id UUID,
    p_cable1_id UUID,
    p_cable2_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    cable1_capacity INT;
    cable2_capacity INT;
    min_capacity INT;
    i INT;
    splice_count INT := 0;
    available_fibers_c1 INT[];
    available_fibers_c2 INT[];
BEGIN
    -- Security Check
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- Get capacities
    SELECT capacity INTO cable1_capacity FROM public.ofc_cables WHERE id = p_cable1_id;
    SELECT capacity INTO cable2_capacity FROM public.ofc_cables WHERE id = p_cable2_id;

    IF cable1_capacity IS NULL OR cable2_capacity IS NULL THEN
        RAISE EXCEPTION 'One or both cables not found.';
    END IF;
    
    min_capacity := LEAST(cable1_capacity, cable2_capacity);

    -- Find available fibers for Cable 1
    SELECT array_agg(s.i) INTO available_fibers_c1
    FROM generate_series(1, cable1_capacity) s(i)
    WHERE NOT EXISTS (
        SELECT 1 FROM public.fiber_splices fs
        WHERE fs.jc_id = p_jc_id
        AND (
            (fs.incoming_cable_id = p_cable1_id AND fs.incoming_fiber_no = s.i) OR
            (fs.outgoing_cable_id = p_cable1_id AND fs.outgoing_fiber_no = s.i)
        )
    );

    -- Find available fibers for Cable 2
    SELECT array_agg(s.i) INTO available_fibers_c2
    FROM generate_series(1, cable2_capacity) s(i)
    WHERE NOT EXISTS (
        SELECT 1 FROM public.fiber_splices fs
        WHERE fs.jc_id = p_jc_id
        AND (
            (fs.incoming_cable_id = p_cable2_id AND fs.incoming_fiber_no = s.i) OR
            (fs.outgoing_cable_id = p_cable2_id AND fs.outgoing_fiber_no = s.i)
        )
    );

    -- Loop through the minimum of the two available fiber lists
    FOR i IN 1..LEAST(cardinality(available_fibers_c1), cardinality(available_fibers_c2))
    LOOP
        INSERT INTO public.fiber_splices (jc_id, incoming_cable_id, incoming_fiber_no, outgoing_cable_id, outgoing_fiber_no, splice_type)
        VALUES (p_jc_id, p_cable1_id, available_fibers_c1[i], p_cable2_id, available_fibers_c2[i], 'pass_through');
        splice_count := splice_count + 1;
    END LOOP;

    RETURN jsonb_build_object('status', 'success', 'splices_created', splice_count);
END;
$$;

-- Grant permissions on the new function
GRANT EXECUTE ON FUNCTION public.auto_splice_straight(UUID, UUID, UUID) TO authenticated;