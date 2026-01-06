-- path: data/migrations/06_utilities/12_service_path_provisioning.sql
-- Description: Contains robust functions for provisioning and deprovisioning end-to-end service paths.

-- FUNCTION 1: Deprovision an existing service path
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
        -- Just clear the connection table references to be safe
        UPDATE public.system_connections
        SET working_fiber_in_ids = NULL, working_fiber_out_ids = NULL, protection_fiber_in_ids = NULL, protection_fiber_out_ids = NULL, updated_at = NOW()
        WHERE id = p_system_connection_id;
        RETURN;
    END IF;

    -- Clear references on all associated fibers
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


-- FUNCTION 2: Provision a new service path (with Upsert/Overwrite capability)
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
    -- ID Variables
    v_system_id UUID;
    v_en_id UUID;
    v_active_status_id UUID;
    v_link_type_id UUID;
    v_working_path_id UUID;
    v_protection_path_id UUID;
    v_all_fiber_ids UUID[];

    -- Port/Interface Variables
    v_sn_interface TEXT;
    v_en_interface TEXT;
    v_sn_protection_interface TEXT;
    v_en_protection_interface TEXT;

    -- Error Reporting Variables
    v_err_fiber_no INT;
    v_err_cable_name TEXT;
    v_err_path_name TEXT;
    v_old_path_id UUID;
BEGIN
    -- 1. Validation and Data Fetching
    -- We fetch full topology details (Source/Dest Systems and Ports) + Service Type
    SELECT 
        sc.system_id, 
        sc.en_id,
        COALESCE(sc.sn_interface, sc.system_working_interface),     -- Source Working Port
        COALESCE(sc.en_interface),                                  -- Dest Working Port
        COALESCE(sc.system_protection_interface, sc.sn_interface, sc.system_working_interface), -- Source Protection Port (Fallback to working)
        COALESCE(sc.en_protection_interface, sc.en_interface),      -- Dest Protection Port (Fallback to working)
        svc.link_type_id                                            -- Map Service Link Type to Path Type
    INTO 
        v_system_id, 
        v_en_id, 
        v_sn_interface, 
        v_en_interface, 
        v_sn_protection_interface, 
        v_en_protection_interface,
        v_link_type_id
    FROM public.system_connections sc
    LEFT JOIN public.services svc ON sc.service_id = svc.id
    WHERE sc.id = p_system_connection_id;

    IF NOT FOUND THEN RAISE EXCEPTION 'System connection with ID % not found', p_system_connection_id; END IF;

    SELECT id INTO v_active_status_id FROM public.lookup_types WHERE category = 'OFC_PATH_STATUS' AND name = 'active' LIMIT 1;
    IF v_active_status_id IS NULL THEN
        RAISE NOTICE 'Operational status "active" not found, continuing without specific status ID.';
    END IF;

    v_all_fiber_ids := p_working_tx_fiber_ids || p_working_rx_fiber_ids || p_protection_tx_fiber_ids || p_protection_rx_fiber_ids;

    -- 2. SMART CONFLICT CHECK
    -- Check if any selected fiber is used by a logical path that belongs to a DIFFERENT connection
    SELECT
        oc.fiber_no_sn,
        c.route_name,
        COALESCE(lp.path_name, 'Unknown Path')
    INTO v_err_fiber_no, v_err_cable_name, v_err_path_name
    FROM public.ofc_connections oc
    JOIN public.ofc_cables c ON oc.ofc_id = c.id
    LEFT JOIN public.logical_fiber_paths lp ON oc.logical_path_id = lp.id
    WHERE oc.id = ANY(v_all_fiber_ids)
      AND oc.logical_path_id IS NOT NULL
      -- Crucial: Only consider it a conflict if the path belongs to someone else
      AND (lp.system_connection_id IS NULL OR lp.system_connection_id != p_system_connection_id)
    LIMIT 1;

    IF v_err_fiber_no IS NOT NULL THEN
        RAISE EXCEPTION 'Provisioning failed: Fiber #% on "%" is already allocated to "%".', v_err_fiber_no, v_err_cable_name, v_err_path_name;
    END IF;

    -- 3. AUTO-CLEANUP (Overwrite existing provisioning for this connection)
    FOR v_old_path_id IN SELECT id FROM public.logical_fiber_paths WHERE system_connection_id = p_system_connection_id LOOP
        UPDATE public.ofc_connections
        SET logical_path_id = NULL, fiber_role = NULL, system_id = NULL, path_direction = NULL, source_port = NULL, destination_port = NULL
        WHERE logical_path_id = v_old_path_id;

        DELETE FROM public.logical_fiber_paths WHERE id = v_old_path_id;
    END LOOP;

    -- 4. Create "Working" Logical Path
    -- Populate ALL topology fields
    INSERT INTO public.logical_fiber_paths (
        path_name, 
        source_system_id, 
        destination_system_id, -- Fill Dest System
        source_port,           -- Fill Source Port
        destination_port,      -- Fill Dest Port
        path_type_id,          -- Fill Type
        path_role, 
        operational_status_id, 
        system_connection_id
    )
    VALUES (
        p_path_name || ' (Working)', 
        v_system_id, 
        v_en_id, 
        v_sn_interface,
        v_en_interface,
        v_link_type_id,
        'working', 
        v_active_status_id, 
        p_system_connection_id
    )
    RETURNING id INTO v_working_path_id;

    -- 5. Assign Fibers to Working Path
    -- Also update physical ports on the fiber record for traceability
    UPDATE public.ofc_connections
    SET logical_path_id = v_working_path_id, fiber_role = 'working', system_id = v_system_id, path_direction = 'tx', source_port = v_sn_interface, destination_port = v_en_interface
    WHERE id = ANY(p_working_tx_fiber_ids);

    UPDATE public.ofc_connections
    SET logical_path_id = v_working_path_id, fiber_role = 'working', system_id = v_system_id, path_direction = 'rx', source_port = v_sn_interface, destination_port = v_en_interface
    WHERE id = ANY(p_working_rx_fiber_ids);

    -- 6. Handle Protection Path (if provided)
    IF array_length(p_protection_tx_fiber_ids, 1) > 0 THEN
        INSERT INTO public.logical_fiber_paths (
            path_name, 
            source_system_id, 
            destination_system_id,
            source_port,             -- Use Protection Ports
            destination_port,
            path_type_id,
            path_role, 
            working_path_id, 
            operational_status_id, 
            system_connection_id
        )
        VALUES (
            p_path_name || ' (Protection)', 
            v_system_id, 
            v_en_id,
            v_sn_protection_interface, 
            v_en_protection_interface,
            v_link_type_id,
            'protection', 
            v_working_path_id, 
            v_active_status_id, 
            p_system_connection_id
        ) 
        RETURNING id INTO v_protection_path_id;

        UPDATE public.ofc_connections
        SET logical_path_id = v_protection_path_id, fiber_role = 'protection', system_id = v_system_id, path_direction = 'tx', source_port = v_sn_protection_interface, destination_port = v_en_protection_interface
        WHERE id = ANY(p_protection_tx_fiber_ids);

        UPDATE public.ofc_connections
        SET logical_path_id = v_protection_path_id, fiber_role = 'protection', system_id = v_system_id, path_direction = 'rx', source_port = v_sn_protection_interface, destination_port = v_en_protection_interface
        WHERE id = ANY(p_protection_rx_fiber_ids);
    END IF;

    -- 7. Update Connection Record with Fiber IDs Cache
    UPDATE public.system_connections
    SET
        working_fiber_in_ids = p_working_tx_fiber_ids,
        working_fiber_out_ids = p_working_rx_fiber_ids,
        protection_fiber_in_ids = p_protection_tx_fiber_ids,
        protection_fiber_out_ids = p_protection_rx_fiber_ids,
        updated_at = NOW()
    WHERE id = p_system_connection_id;

    RETURN v_working_path_id;
END;
$$;


-- FUNCTION 3: Get structured path details for display (Unchanged but included for completeness)
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
  CASE
      WHEN path_role = 'working' AND path_direction = 'tx' THEN 'working_tx'
      WHEN path_role = 'working' AND path_direction = 'rx' THEN 'working_rx'
      WHEN path_role = 'protection' AND path_direction = 'tx' THEN 'protection_tx'
      WHEN path_role = 'protection' AND path_direction = 'rx' THEN 'protection_rx'
      ELSE path_role || '_' || path_direction
  END,
  path_string
)
FROM aggregated_paths;
$$;

-- Grants
GRANT EXECUTE ON FUNCTION public.provision_service_path(UUID, TEXT, UUID[], UUID[], UUID[], UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deprovision_service_path(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_service_path_display(UUID) TO authenticated;