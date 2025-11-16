-- path: data/migrations/06_utilities/11_deprovision_fibers.sql
-- Description: Creates a function to safely deprovision all fibers from a system connection.

CREATE OR REPLACE FUNCTION public.deprovision_fibers_from_connection(
    p_system_connection_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Step 1: Nullify the fiber role and system_id for all associated connections
    UPDATE public.ofc_connections
    SET
        system_id = NULL,
        fiber_role = NULL,
        source_port = NULL,
        destination_port = NULL
    WHERE id IN (
        SELECT working_fiber_in_id FROM public.system_connections WHERE id = p_system_connection_id
        UNION ALL
        SELECT working_fiber_out_id FROM public.system_connections WHERE id = p_system_connection_id
        UNION ALL
        SELECT protection_fiber_in_id FROM public.system_connections WHERE id = p_system_connection_id
        UNION ALL
        SELECT protection_fiber_out_id FROM public.system_connections WHERE id = p_system_connection_id
    );

    -- Step 2: Clear the path references on the system_connections table itself
    UPDATE public.system_connections
    SET
        working_fiber_in_id = NULL,
        working_fiber_out_id = NULL,
        protection_fiber_in_id = NULL,
        protection_fiber_out_id = NULL,
        updated_at = NOW()
    WHERE id = p_system_connection_id;

END;
$$;

GRANT EXECUTE ON FUNCTION public.deprovision_fibers_from_connection(UUID) TO authenticated;