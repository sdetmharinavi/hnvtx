-- path: functions/manage_splice_v2.sql

CREATE OR REPLACE FUNCTION manage_splice(
    p_action TEXT,
    p_jc_id UUID,
    p_splice_id UUID DEFAULT NULL,
    p_incoming_cable_id UUID DEFAULT NULL,
    p_incoming_fiber_no INT DEFAULT NULL,
    p_outgoing_cable_id UUID DEFAULT NULL,
    p_outgoing_fiber_no INT DEFAULT NULL,
    p_splice_type TEXT DEFAULT 'pass_through',
    p_otdr_length_km NUMERIC DEFAULT NULL -- <--- ADDED
)
RETURNS RECORD
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result RECORD;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF p_action = 'create' THEN
        INSERT INTO public.fiber_splices (jc_id, incoming_cable_id, incoming_fiber_no, outgoing_cable_id, outgoing_fiber_no, splice_type, otdr_length_km)
        VALUES (p_jc_id, p_incoming_cable_id, p_incoming_fiber_no, p_outgoing_cable_id, p_outgoing_fiber_no, p_splice_type, p_otdr_length_km) -- <--- ADDED
        RETURNING id, 'created' INTO result;
    ELSIF p_action = 'delete' THEN
        DELETE FROM public.fiber_splices WHERE id = p_splice_id AND jc_id = p_jc_id
        RETURNING id, 'deleted' INTO result;
        IF NOT FOUND THEN RAISE EXCEPTION 'Splice not found.'; END IF;
    -- NEW: Add an action to update OTDR length on an existing splice
    ELSIF p_action = 'update_otdr' THEN
        UPDATE public.fiber_splices
        SET otdr_length_km = p_otdr_length_km, updated_at = now()
        WHERE id = p_splice_id AND jc_id = p_jc_id
        RETURNING id, 'updated' INTO result;
        IF NOT FOUND THEN RAISE EXCEPTION 'Splice not found.'; END IF;
    ELSE
        RAISE EXCEPTION 'Invalid action.';
    END IF;

    RETURN result;
END;
$$;