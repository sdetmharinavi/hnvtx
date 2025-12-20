-- path: data/migrations/06_utilities/13_fiber_assignment_rpc.sql
-- Description: Allows assigning/moving a specific fiber to a system connection and releasing it.

CREATE OR REPLACE FUNCTION public.assign_fiber_to_connection(
    p_fiber_id UUID,
    p_connection_id UUID,
    p_role TEXT,        -- 'working' or 'protection'
    p_direction TEXT    -- 'tx' or 'rx'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_system_id UUID;
    v_active_status_id UUID;
    v_logical_path_id UUID;
    v_path_name TEXT;
    v_column_name TEXT;
BEGIN
    -- 1. Validation: Get Connection Details
    SELECT system_id, service_name, connected_system_name 
    INTO v_system_id, v_path_name
    FROM public.v_system_connections_complete 
    WHERE id = p_connection_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'System Connection not found.';
    END IF;

    v_path_name := COALESCE(v_path_name, 'Path');

    SELECT id INTO v_active_status_id FROM public.lookup_types 
    WHERE category = 'OFC_PATH_STATUS' AND name = 'active' LIMIT 1;

    -- 2. SMART CLEANUP: Remove this fiber ID from ALL array columns in system_connections
    -- This handles "Moving" the fiber from one connection to another automatically.
    UPDATE public.system_connections
    SET 
        working_fiber_in_ids = array_remove(working_fiber_in_ids, p_fiber_id),
        working_fiber_out_ids = array_remove(working_fiber_out_ids, p_fiber_id),
        protection_fiber_in_ids = array_remove(protection_fiber_in_ids, p_fiber_id),
        protection_fiber_out_ids = array_remove(protection_fiber_out_ids, p_fiber_id)
    WHERE p_fiber_id = ANY(working_fiber_in_ids)
       OR p_fiber_id = ANY(working_fiber_out_ids)
       OR p_fiber_id = ANY(protection_fiber_in_ids)
       OR p_fiber_id = ANY(protection_fiber_out_ids);

    -- 3. Find or Create Logical Path for the TARGET connection
    SELECT id INTO v_logical_path_id
    FROM public.logical_fiber_paths
    WHERE system_connection_id = p_connection_id AND path_role = p_role
    LIMIT 1;

    IF v_logical_path_id IS NULL THEN
        INSERT INTO public.logical_fiber_paths (
            path_name, source_system_id, path_role, operational_status_id, system_connection_id
        )
        VALUES (
            v_path_name || ' (' || INITCAP(p_role) || ')', 
            v_system_id, p_role, v_active_status_id, p_connection_id
        )
        RETURNING id INTO v_logical_path_id;
    END IF;

    -- 4. Update the Fiber Record
    UPDATE public.ofc_connections
    SET 
        system_id = v_system_id,
        logical_path_id = v_logical_path_id,
        fiber_role = p_role,
        path_direction = p_direction,
        updated_at = NOW()
    WHERE id = p_fiber_id;

    -- 5. Add to new System Connection Array
    IF p_role = 'working' AND p_direction = 'tx' THEN v_column_name := 'working_fiber_in_ids';
    ELSIF p_role = 'working' AND p_direction = 'rx' THEN v_column_name := 'working_fiber_out_ids';
    ELSIF p_role = 'protection' AND p_direction = 'tx' THEN v_column_name := 'protection_fiber_in_ids';
    ELSIF p_role = 'protection' AND p_direction = 'rx' THEN v_column_name := 'protection_fiber_out_ids';
    END IF;

    EXECUTE format('
        UPDATE public.system_connections 
        SET %I = array_append(COALESCE(%I, ARRAY[]::uuid[]), $1) 
        WHERE id = $2', v_column_name, v_column_name)
    USING p_fiber_id, p_connection_id;
END;
$$;

-- New Unlink Function
CREATE OR REPLACE FUNCTION public.release_fiber_from_connection(
    p_fiber_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- 1. Remove from system_connections arrays
    UPDATE public.system_connections
    SET 
        working_fiber_in_ids = array_remove(working_fiber_in_ids, p_fiber_id),
        working_fiber_out_ids = array_remove(working_fiber_out_ids, p_fiber_id),
        protection_fiber_in_ids = array_remove(protection_fiber_in_ids, p_fiber_id),
        protection_fiber_out_ids = array_remove(protection_fiber_out_ids, p_fiber_id)
    WHERE p_fiber_id = ANY(working_fiber_in_ids)
       OR p_fiber_id = ANY(working_fiber_out_ids)
       OR p_fiber_id = ANY(protection_fiber_in_ids)
       OR p_fiber_id = ANY(protection_fiber_out_ids);

    -- 2. Clear Fiber Record
    UPDATE public.ofc_connections
    SET 
        system_id = NULL,
        logical_path_id = NULL,
        fiber_role = NULL,
        path_direction = NULL,
        updated_at = NOW()
    WHERE id = p_fiber_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.assign_fiber_to_connection(UUID, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_fiber_from_connection(UUID) TO authenticated;