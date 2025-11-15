-- path: data/migrations/03_network_systems/05_functions_provisioning.sql
-- Description: Contains functions for provisioning fibers to system connections.

-- --- THIS IS THE NEW, MORE POWERFUL FUNCTION ---
-- It accepts arrays of fiber IDs for transactional updates.
CREATE OR REPLACE FUNCTION public.provision_fibers_to_connection(
    p_system_connection_id UUID,
    p_working_fiber_ids UUID[],
    p_protection_fiber_ids UUID[] DEFAULT ARRAY[]::UUID[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_system_id UUID;
    v_sn_interface TEXT;
    v_en_interface TEXT;
BEGIN
    -- Get the parent system_id and interface names from the system_connection
    SELECT system_id, sn_interface, en_interface 
    INTO v_system_id, v_sn_interface, v_en_interface
    FROM public.system_connections 
    WHERE id = p_system_connection_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'System connection with ID % not found', p_system_connection_id;
    END IF;

    -- Step 1: Update the system_connections table with the FIRST and LAST fiber IDs in each path.
    UPDATE public.system_connections
    SET
        working_fiber_in_id = p_working_fiber_ids[1],
        working_fiber_out_id = p_working_fiber_ids[array_upper(p_working_fiber_ids, 1)],
        protection_fiber_in_id = p_protection_fiber_ids[1],
        protection_fiber_out_id = p_protection_fiber_ids[array_upper(p_protection_fiber_ids, 1)],
        updated_at = NOW()
    WHERE id = p_system_connection_id;

    -- Step 2: Atomically update ALL working fibers in the ofc_connections table.
    -- The `source_port` is the interface on the Start Node (sn) of the connection.
    -- The `destination_port` is the interface on the End Node (en) of the connection.
    UPDATE public.ofc_connections
    SET 
        system_id = v_system_id,
        source_port = v_sn_interface,
        destination_port = v_en_interface,
        fiber_role = 'working'
    WHERE id = ANY(p_working_fiber_ids);

    -- Step 3: Atomically update ALL protection fibers, if they exist.
    IF array_length(p_protection_fiber_ids, 1) > 0 THEN
        UPDATE public.ofc_connections
        SET 
            system_id = v_system_id,
            source_port = v_sn_interface, -- Assuming same interfaces for protection path
            destination_port = v_en_interface,
            fiber_role = 'protection'
        WHERE id = ANY(p_protection_fiber_ids);
    END IF;

END;
$$;

-- Grant execute on the new function signature. Note the array types `UUID[]`.
GRANT EXECUTE ON FUNCTION public.provision_fibers_to_connection(UUID, UUID[], UUID[]) TO authenticated;


-- (The old function can be removed or left, but we will no longer use it)
DROP FUNCTION IF EXISTS public.assign_system_to_fibers(UUID, UUID, INT, INT, UUID);