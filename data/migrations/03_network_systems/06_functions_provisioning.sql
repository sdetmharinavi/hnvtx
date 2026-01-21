-- path: data/migrations/03_network_systems/06_functions_provisioning.sql
-- Description: Contains functions for provisioning fibers to system connections.

-- path: data/migrations/03_network_systems/05_functions_provisioning.sql
-- Description: Contains functions for provisioning fibers to system connections. [CORRECTED COLUMN NAMES]

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

    -- Step 1: Update the system_connections table with the FULL arrays of fiber IDs.
    -- [FIX]: Use plural column names to match table schema
    UPDATE public.system_connections
    SET
        working_fiber_in_ids = p_working_fiber_ids,
        working_fiber_out_ids = p_working_fiber_ids,
        protection_fiber_in_ids = p_protection_fiber_ids,
        protection_fiber_out_ids = p_protection_fiber_ids,
        updated_at = NOW()
    WHERE id = p_system_connection_id;

    -- Step 2: Atomically update ALL working fibers in the ofc_connections table.
    UPDATE public.ofc_connections
    SET
        system_id = v_system_id,
        source_port = v_sn_interface,
        destination_port = v_en_interface,
        fiber_role = 'working',
        updated_at = NOW()
    WHERE id = ANY(p_working_fiber_ids);

    -- Step 3: Atomically update ALL protection fibers, if they exist.
    IF array_length(p_protection_fiber_ids, 1) > 0 THEN
        UPDATE public.ofc_connections
        SET
            system_id = v_system_id,
            source_port = v_sn_interface,
            destination_port = v_en_interface,
            fiber_role = 'protection',
            updated_at = NOW()
        WHERE id = ANY(p_protection_fiber_ids);
    END IF;

END;
$$;

GRANT EXECUTE ON FUNCTION public.provision_fibers_to_connection(UUID, UUID[], UUID[]) TO authenticated;


-- (The old function can be removed or left, but we will no longer use it)
DROP FUNCTION IF EXISTS public.assign_system_to_fibers(UUID, UUID, INT, INT, UUID);

CREATE OR REPLACE FUNCTION public.get_ring_manager_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total_rings INT;
    v_spec_issued INT;
    v_spec_pending INT;
    v_ofc_ready INT;
    v_ofc_partial_ready INT;
    v_ofc_pending INT;
    v_on_air_nodes INT;
    v_configured_in_maan INT;
BEGIN
    -- Basic Ring Counts
    SELECT COUNT(*) INTO v_total_rings FROM public.rings WHERE status = true;
    
    SELECT COUNT(*) INTO v_spec_issued FROM public.rings WHERE status = true AND spec_status = 'Issued';
    SELECT COUNT(*) INTO v_spec_pending FROM public.rings WHERE status = true AND (spec_status = 'Pending' OR spec_status IS NULL);
    
    SELECT COUNT(*) INTO v_ofc_ready FROM public.rings WHERE status = true AND ofc_status = 'Ready';
    SELECT COUNT(*) INTO v_ofc_partial_ready FROM public.rings WHERE status = true AND ofc_status = 'Partial Ready';
    SELECT COUNT(*) INTO v_ofc_pending FROM public.rings WHERE status = true AND (ofc_status = 'Pending' OR ofc_status IS NULL);

    SELECT COUNT(*) INTO v_configured_in_maan FROM public.rings WHERE status = true AND (bts_status = 'Configured');

    -- Complex Count: Nodes (BTS/BTS-RL) that are in Rings marked as 'On-Air'
    -- We join Rings -> Ring_Systems -> Systems -> Nodes -> Node_Types
    SELECT COUNT(DISTINCT n.id)
    INTO v_on_air_nodes
    FROM public.nodes n
    JOIN public.lookup_types lt ON n.node_type_id = lt.id
    JOIN public.systems s ON s.node_id = n.id
    JOIN public.ring_based_systems rbs ON rbs.system_id = s.id
    JOIN public.rings r ON r.id = rbs.ring_id
    WHERE 
        r.status = true 
        AND r.bts_status = 'On-Air'
        AND lt.category = 'NODE_TYPES'
        AND (lt.code = 'BTS' OR lt.code = 'BTS-RL');

    RETURN jsonb_build_object(
        'total_rings', v_total_rings,
        'spec_issued', v_spec_issued,
        'spec_pending', v_spec_pending,
        'ofc_ready', v_ofc_ready,
        'ofc_partial_ready', v_ofc_partial_ready,
        'ofc_pending', v_ofc_pending,
        'on_air_nodes', v_on_air_nodes,
        'configured_in_maan', v_configured_in_maan
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_ring_manager_stats() TO authenticated;
GRANT SELECT ON public.v_rings TO authenticated;
