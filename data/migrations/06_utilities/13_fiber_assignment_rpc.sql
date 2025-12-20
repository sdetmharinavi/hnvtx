-- path: data/migrations/06_utilities/13_fiber_assignment_rpc.sql
-- Description: Allows assigning a specific fiber to an existing system connection (Reverse Provisioning).

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
    v_existing_fibers UUID[];
BEGIN
    -- 1. Validation: Get Connection Details
    SELECT system_id, service_name, connected_system_name 
    INTO v_system_id, v_path_name
    FROM public.v_system_connections_complete 
    WHERE id = p_connection_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'System Connection not found.';
    END IF;

    -- Use Service Name or fallback to System Name for the path
    v_path_name := COALESCE(v_path_name, 'Path');

    -- 2. Get Status ID for 'active'
    SELECT id INTO v_active_status_id FROM public.lookup_types 
    WHERE category = 'OFC_PATH_STATUS' AND name = 'active' LIMIT 1;

    -- 3. Find or Create Logical Path
    -- We try to find an existing logical path for this connection and role
    SELECT id INTO v_logical_path_id
    FROM public.logical_fiber_paths
    WHERE system_connection_id = p_connection_id AND path_role = p_role
    LIMIT 1;

    IF v_logical_path_id IS NULL THEN
        INSERT INTO public.logical_fiber_paths (
            path_name, 
            source_system_id, 
            path_role, 
            operational_status_id, 
            system_connection_id
        )
        VALUES (
            v_path_name || ' (' || INITCAP(p_role) || ')', 
            v_system_id, 
            p_role, 
            v_active_status_id, 
            p_connection_id
        )
        RETURNING id INTO v_logical_path_id;
    END IF;

    -- 4. Update the Fiber Record (ofc_connections)
    UPDATE public.ofc_connections
    SET 
        system_id = v_system_id,
        logical_path_id = v_logical_path_id,
        fiber_role = p_role,
        path_direction = p_direction,
        updated_at = NOW()
    WHERE id = p_fiber_id;

    -- 5. Update the System Connection Arrays (system_connections)
    -- Determine which column to update based on role/direction
    IF p_role = 'working' AND p_direction = 'tx' THEN
        v_column_name := 'working_fiber_in_ids';
    ELSIF p_role = 'working' AND p_direction = 'rx' THEN
        v_column_name := 'working_fiber_out_ids';
    ELSIF p_role = 'protection' AND p_direction = 'tx' THEN
        v_column_name := 'protection_fiber_in_ids';
    ELSIF p_role = 'protection' AND p_direction = 'rx' THEN
        v_column_name := 'protection_fiber_out_ids';
    ELSE
        RAISE EXCEPTION 'Invalid Role/Direction combination.';
    END IF;

    -- Execute dynamic update to append fiber ID to the correct array
    -- We use distinct to prevent duplicates if the user clicks multiple times
    EXECUTE format('
        UPDATE public.system_connections 
        SET %I = array_append(COALESCE(%I, ARRAY[]::uuid[]), $1) 
        WHERE id = $2 AND NOT ($1 = ANY(COALESCE(%I, ARRAY[]::uuid[])))', 
        v_column_name, v_column_name, v_column_name)
    USING p_fiber_id, p_connection_id;

END;
$$;

GRANT EXECUTE ON FUNCTION public.assign_fiber_to_connection(UUID, UUID, TEXT, TEXT) TO authenticated;