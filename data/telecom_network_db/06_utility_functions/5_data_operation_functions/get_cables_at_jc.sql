-- This function finds all relevant OFC cables that are present at a specific Junction Closure.
-- It is used to populate the "Add Cable to Matrix" dropdown in the Splice Matrix modal.
CREATE OR REPLACE FUNCTION get_cables_at_jc(p_jc_id UUID)
RETURNS TABLE (
    id UUID,
    route_name TEXT,
    capacity INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH jc_info AS (
        SELECT
            oc.sn_id,
            oc.en_id
        FROM public.junction_closures jc
        JOIN public.ofc_cables oc ON jc.ofc_cable_id = oc.id
        WHERE jc.id = p_jc_id
    )
    SELECT
        c.id,
        c.route_name,
        c.capacity
    FROM public.ofc_cables c
    WHERE
        c.sn_id IN (SELECT sn_id FROM jc_info)
        OR c.en_id IN (SELECT en_id FROM jc_info)
        OR c.sn_id IN (SELECT en_id FROM jc_info)
        OR c.en_id IN (SELECT sn_id FROM jc_info);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_cables_at_jc(UUID) TO authenticated;
