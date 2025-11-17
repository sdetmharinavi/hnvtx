-- path: data/migrations/06_utilities/12_service_path_provisioning.sql
-- Description: Contains robust functions for provisioning and deprovisioning end-to-end service paths. (Corrected FK Logic)



-- FUNCTION 1: REWRITTEN - Provision a new service path
DROP FUNCTION IF EXISTS public.provision_service_path(uuid,text,uuid[],uuid[],uuid[],uuid[]);
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
    -- Validation and Setup
    SELECT system_id INTO v_system_id FROM public.system_connections WHERE id = p_system_connection_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'System connection with ID % not found', p_system_connection_id; END IF;

    SELECT id INTO v_active_status_id FROM public.lookup_types WHERE category = 'OFC_PATH_STATUS' AND name = 'active' LIMIT 1;
    IF v_active_status_id IS NULL THEN RAISE EXCEPTION 'Operational status "active" not found in lookup_types.'; END IF;
    
    v_all_fiber_ids := p_working_tx_fiber_ids || p_working_rx_fiber_ids || p_protection_tx_fiber_ids || p_protection_rx_fiber_ids;

    IF EXISTS (SELECT 1 FROM public.ofc_connections WHERE id = ANY(v_all_fiber_ids) AND logical_path_id IS NOT NULL) THEN
        RAISE EXCEPTION 'One or more selected fibers are already part of another logical path.';
    END IF;

    -- Create "working" logical_fiber_path record, linking it to the system connection
    INSERT INTO public.logical_fiber_paths (path_name, source_system_id, path_role, operational_status_id, system_connection_id)
    VALUES (p_path_name || ' (Working)', v_system_id, 'working', v_active_status_id, p_system_connection_id) RETURNING id INTO v_working_path_id;

    -- Update working fibers with the correct logical_path_id, role, and direction
    UPDATE public.ofc_connections 
    SET logical_path_id = v_working_path_id, fiber_role = 'working', system_id = v_system_id, path_direction = 'tx'
    WHERE id = ANY(p_working_tx_fiber_ids);
    
    UPDATE public.ofc_connections 
    SET logical_path_id = v_working_path_id, fiber_role = 'working', system_id = v_system_id, path_direction = 'rx'
    WHERE id = ANY(p_working_rx_fiber_ids);

    -- Store the full arrays of fiber IDs in the system_connections table
    UPDATE public.system_connections 
    SET working_fiber_in_ids = p_working_tx_fiber_ids, working_fiber_out_ids = p_working_rx_fiber_ids 
    WHERE id = p_system_connection_id;

    -- Handle protection path if provided
    IF array_length(p_protection_tx_fiber_ids, 1) > 0 THEN
        INSERT INTO public.logical_fiber_paths (path_name, source_system_id, path_role, working_path_id, operational_status_id, system_connection_id)
        VALUES (p_path_name || ' (Protection)', v_system_id, 'protection', v_working_path_id, v_active_status_id, p_system_connection_id) RETURNING id INTO v_protection_path_id;
        
        UPDATE public.ofc_connections 
        SET logical_path_id = v_protection_path_id, fiber_role = 'protection', system_id = v_system_id, path_direction = 'tx'
        WHERE id = ANY(p_protection_tx_fiber_ids);

        UPDATE public.ofc_connections 
        SET logical_path_id = v_protection_path_id, fiber_role = 'protection', system_id = v_system_id, path_direction = 'rx'
        WHERE id = ANY(p_protection_rx_fiber_ids);

        UPDATE public.system_connections 
        SET protection_fiber_in_ids = p_protection_tx_fiber_ids, protection_fiber_out_ids = p_protection_rx_fiber_ids 
        WHERE id = p_system_connection_id;
    END IF;

    RETURN v_working_path_id;
END;
$$;


-- FUNCTION 2: REWRITTEN - Deprovision an existing service path
DROP FUNCTION IF EXISTS public.deprovision_service_path(uuid);
CREATE OR REPLACE FUNCTION public.deprovision_service_path(
    p_system_connection_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_path_ids UUID[];
BEGIN
    -- Find all logical paths associated with this system connection
    SELECT array_agg(id) INTO v_path_ids
    FROM public.logical_fiber_paths
    WHERE system_connection_id = p_system_connection_id;

    IF v_path_ids IS NULL OR array_length(v_path_ids, 1) = 0 THEN
        RAISE NOTICE 'No logical paths found for system connection % to deprovision.', p_system_connection_id;
        -- Still clear the system_connections table just in case of inconsistent data
        UPDATE public.system_connections
        SET working_fiber_in_ids = NULL, working_fiber_out_ids = NULL, protection_fiber_in_ids = NULL, protection_fiber_out_ids = NULL, updated_at = NOW()
        WHERE id = p_system_connection_id;
        RETURN;
    END IF;

    -- Clear references on all associated fibers by querying for the logical path IDs
    UPDATE public.ofc_connections
    SET logical_path_id = NULL, fiber_role = NULL, system_id = NULL, path_segment_order = NULL, path_direction = NULL
    WHERE logical_path_id = ANY(v_path_ids);

    -- Clear references on the system_connection itself
    UPDATE public.system_connections
    SET working_fiber_in_ids = NULL, working_fiber_out_ids = NULL, protection_fiber_in_ids = NULL, protection_fiber_out_ids = NULL, updated_at = NOW()
    WHERE id = p_system_connection_id;

    -- Delete the logical path records
    DELETE FROM public.logical_fiber_paths WHERE id = ANY(v_path_ids);
END;
$$;


-- FUNCTION 3: NEW - Get structured path details for display
CREATE OR REPLACE FUNCTION public.get_service_path_display(p_system_connection_id UUID)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
WITH path_fibers AS (
  SELECT
    lfp.id,
    lfp.path_role,
    oc.path_direction,
    oc.id as fiber_id,
    oc.path_segment_order,
    cable.route_name,
    oc.fiber_no_sn
  FROM public.logical_fiber_paths lfp
  JOIN public.ofc_connections oc ON lfp.id = oc.logical_path_id
  JOIN public.ofc_cables cable ON oc.ofc_id = cable.id
  WHERE lfp.system_connection_id = p_system_connection_id
),
aggregated_paths AS (
  SELECT
    path_role,
    path_direction,
    string_agg(
      route_name || '(F' || fiber_no_sn || ')',
      ' → ' ORDER BY path_segment_order
    ) AS path_string
  FROM path_fibers
  GROUP BY path_role, path_direction
)
SELECT jsonb_object_agg(
  path_role || '_' || path_direction,
  path_string
)
FROM aggregated_paths;
$$;

GRANT EXECUTE ON FUNCTION public.provision_service_path(UUID, TEXT, UUID[], UUID[], UUID[], UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deprovision_service_path(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_service_path_display(UUID) TO authenticated;