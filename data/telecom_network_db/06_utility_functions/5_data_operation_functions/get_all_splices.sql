-- path: functions/get_all_splices.sql
CREATE OR REPLACE FUNCTION get_all_splices()
RETURNS TABLE (
    splice_id UUID,
    jc_id UUID,
    jc_name TEXT,
    jc_position_km NUMERIC,
    incoming_cable_id UUID,
    incoming_fiber_no INT,
    outgoing_cable_id UUID,
    outgoing_fiber_no INT,
    otdr_length_km NUMERIC,
    loss_db NUMERIC
)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
    SELECT
        s.id as splice_id,
        s.jc_id,
        jc.name as jc_name,
        jc.position_km,
        s.incoming_cable_id,
        s.incoming_fiber_no,
        s.outgoing_cable_id,
        s.outgoing_fiber_no,
        s.otdr_length_km,
        s.loss_db
    FROM
        public.fiber_splices s
    JOIN
        public.junction_closures jc ON s.jc_id = jc.id;
$$;

GRANT EXECUTE ON FUNCTION public.get_all_splices() TO authenticated;