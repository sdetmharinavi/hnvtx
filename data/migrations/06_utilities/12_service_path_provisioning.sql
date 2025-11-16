-- path: data/migrations/06_utilities/12_service_path_provisioning.sql
-- Description: Contains robust functions for provisioning and deprovisioning end-to-end service paths. (Corrected FK Logic)

-- FUNCTION 1: Provision a new service path
CREATE OR REPLACE FUNCTION public.provision_service_path(
    p_system_connection_id UUID,
    p_path_name TEXT,
    p_working_tx_fiber_ids UUID[],
    p_working_rx_fiber_ids UUID[],
    p_protection_tx_fiber_ids UUID[] DEFAULT ARRAY[]::UUID[],
    p_protection_rx_fiber_ids UUID[] DEFAULT ARRAY[]::UUID[]
)
RETURNS UUID -- Returns the ID of the new working logical_fiber_path
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_system_id UUID;
    v_active_status_id UUID;
    v_working_path_id UUID;
    v_protection_path_id UUID;
    v_all_fiber_ids UUID[];
BEGIN
    SELECT system_id INTO v_system_id FROM public.system_connections WHERE id = p_system_connection_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'System connection with ID % not found', p_system_connection_id; END IF;

    SELECT id INTO v_active_status_id FROM public.lookup_types WHERE category = 'OFC_PATH_STATUS' AND name = 'active' LIMIT 1;
    IF v_active_status_id IS NULL THEN RAISE EXCEPTION 'Operational status "active" not found in lookup_types.'; END IF;
    
    v_all_fiber_ids := p_working_tx_fiber_ids || p_working_rx_fiber_ids || p_protection_tx_fiber_ids || p_protection_rx_fiber_ids;

    IF (SELECT COUNT(*) FROM unnest(v_all_fiber_ids) a(id) WHERE a.id IS NOT NULL) != (SELECT COUNT(DISTINCT id) FROM unnest(v_all_fiber_ids) a(id) WHERE a.id IS NOT NULL) THEN
        RAISE EXCEPTION 'Duplicate fiber IDs are not allowed in the same path definition.';
    END IF;

    IF EXISTS (SELECT 1 FROM public.ofc_connections WHERE id = ANY(v_all_fiber_ids) AND logical_path_id IS NOT NULL) THEN
        RAISE EXCEPTION 'One or more selected fibers are already part of another logical path.';
    END IF;

    -- Create the "working" logical_fiber_path record
    INSERT INTO public.logical_fiber_paths (path_name, source_system_id, path_role, operational_status_id)
    VALUES (p_path_name || ' (Working)', v_system_id, 'working', v_active_status_id) RETURNING id INTO v_working_path_id;

    -- Update working fibers WITH the correct logical_path_id and path_segment_order
    WITH indexed_fibers AS (SELECT unnest(p_working_tx_fiber_ids) AS id, generate_series(1, array_length(p_working_tx_fiber_ids, 1)) as segment_order)
    UPDATE public.ofc_connections SET logical_path_id = v_working_path_id, fiber_role = 'working', system_id = v_system_id, path_segment_order = indexed_fibers.segment_order FROM indexed_fibers WHERE public.ofc_connections.id = indexed_fibers.id;
    
    WITH indexed_fibers AS (SELECT unnest(p_working_rx_fiber_ids) AS id, generate_series(1, array_length(p_working_rx_fiber_ids, 1)) as segment_order)
    UPDATE public.ofc_connections SET logical_path_id = v_working_path_id, fiber_role = 'working', system_id = v_system_id, path_segment_order = indexed_fibers.segment_order FROM indexed_fibers WHERE public.ofc_connections.id = indexed_fibers.id;

    -- *** THE FIX: Store the actual FIBER IDs from the start of the paths. ***
    UPDATE public.system_connections SET working_fiber_in_id = p_working_tx_fiber_ids[1], working_fiber_out_id = p_working_rx_fiber_ids[1] WHERE id = p_system_connection_id;

    -- Handle protection path if provided
    IF array_length(p_protection_tx_fiber_ids, 1) > 0 THEN
        INSERT INTO public.logical_fiber_paths (path_name, source_system_id, path_role, working_path_id, operational_status_id)
        VALUES (p_path_name || ' (Protection)', v_system_id, 'protection', v_working_path_id, v_active_status_id) RETURNING id INTO v_protection_path_id;
        
        WITH indexed_fibers AS (SELECT unnest(p_protection_tx_fiber_ids) AS id, generate_series(1, array_length(p_protection_tx_fiber_ids, 1)) as segment_order)
        UPDATE public.ofc_connections SET logical_path_id = v_protection_path_id, fiber_role = 'protection', system_id = v_system_id, path_segment_order = indexed_fibers.segment_order FROM indexed_fibers WHERE public.ofc_connections.id = indexed_fibers.id;

        WITH indexed_fibers AS (SELECT unnest(p_protection_rx_fiber_ids) AS id, generate_series(1, array_length(p_protection_rx_fiber_ids, 1)) as segment_order)
        UPDATE public.ofc_connections SET logical_path_id = v_protection_path_id, fiber_role = 'protection', system_id = v_system_id, path_segment_order = indexed_fibers.segment_order FROM indexed_fibers WHERE public.ofc_connections.id = indexed_fibers.id;

        -- *** THE FIX: Store the actual FIBER IDs for the protection path. ***
        UPDATE public.system_connections SET protection_fiber_in_id = p_protection_tx_fiber_ids[1], protection_fiber_out_id = p_protection_rx_fiber_ids[1] WHERE id = p_system_connection_id;
    END IF;

    RETURN v_working_path_id;
END;
$$;


-- FUNCTION 2: Deprovision an existing service path (Corrected to find the logical path via the fiber)
CREATE OR REPLACE FUNCTION public.deprovision_service_path(
    p_system_connection_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_working_start_fiber_id UUID;
    v_working_path_id UUID;
    v_protection_path_id UUID;
BEGIN
    -- Find the starting fiber ID from the system connection
    SELECT working_fiber_in_id INTO v_working_start_fiber_id
    FROM public.system_connections
    WHERE id = p_system_connection_id;

    IF v_working_start_fiber_id IS NULL THEN
        RAISE NOTICE 'No working path found for system connection % to deprovision.', p_system_connection_id;
        RETURN;
    END IF;

    -- Now, find the logical path ID from that starting fiber
    SELECT logical_path_id INTO v_working_path_id FROM public.ofc_connections WHERE id = v_working_start_fiber_id;
    
    -- Find the associated protection path
    IF v_working_path_id IS NOT NULL THEN
      SELECT id INTO v_protection_path_id FROM public.logical_fiber_paths WHERE working_path_id = v_working_path_id;
    END IF;

    -- Clear references on all associated fibers by querying for the logical path IDs
    UPDATE public.ofc_connections
    SET logical_path_id = NULL, fiber_role = NULL, system_id = NULL, path_segment_order = NULL
    WHERE logical_path_id = v_working_path_id OR (v_protection_path_id IS NOT NULL AND logical_path_id = v_protection_path_id);

    -- Clear references on the system_connection itself
    UPDATE public.system_connections
    SET working_fiber_in_id = NULL, working_fiber_out_id = NULL, protection_fiber_in_id = NULL, protection_fiber_out_id = NULL, updated_at = NOW()
    WHERE id = p_system_connection_id;

    -- Delete the logical path records
    IF v_working_path_id IS NOT NULL THEN
      DELETE FROM public.logical_fiber_paths WHERE id = v_working_path_id OR id = v_protection_path_id;
    END IF;
END;
$$;


GRANT EXECUTE ON FUNCTION public.provision_service_path(UUID, TEXT, UUID[], UUID[], UUID[], UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deprovision_service_path(UUID) TO authenticated;