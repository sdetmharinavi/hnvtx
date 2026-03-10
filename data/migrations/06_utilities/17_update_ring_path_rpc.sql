-- path: data/migrations/06_utilities/18_update_ring_path_rpc.sql
-- Description: Updates a logical path and propagates name/config changes to related Services and Fiber Paths.

CREATE OR REPLACE FUNCTION public.update_ring_path_configuration(
    p_path_id UUID,
    p_new_name TEXT,
    p_source_system_id UUID,
    p_source_port TEXT,
    p_dest_system_id UUID DEFAULT NULL,
    p_dest_port TEXT DEFAULT NULL,
    p_link_type_id UUID DEFAULT NULL,
    p_bandwidth TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_old_name TEXT;
    v_old_status TEXT;
    v_start_node_id UUID;
    v_end_node_id UUID;
    v_service_id UUID;
BEGIN
    -- 1. Get current state
    SELECT name, status, start_node_id, end_node_id 
    INTO v_old_name, v_old_status, v_start_node_id, v_end_node_id
    FROM public.logical_paths
    WHERE id = p_path_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Logical Path with ID % not found', p_path_id;
    END IF;

    -- 2. Update the Logical Path (The Plan)
    UPDATE public.logical_paths
    SET
        name = p_new_name,
        source_system_id = p_source_system_id,
        source_port = p_source_port,
        destination_system_id = p_dest_system_id,
        destination_port = p_dest_port,
        status = CASE 
            WHEN v_old_status = 'unprovisioned' THEN 'configured' 
            ELSE v_old_status 
        END,
        updated_at = NOW()
    WHERE id = p_path_id;

    -- 3. Propagate to Services (Business Logic)
    -- Try to find the service by the old name
    SELECT id INTO v_service_id FROM public.services WHERE name = v_old_name LIMIT 1;
    
    IF v_service_id IS NOT NULL THEN
        -- Update existing service
        UPDATE public.services
        SET
            name = p_new_name,
            link_type_id = COALESCE(p_link_type_id, link_type_id),
            bandwidth_allocated = COALESCE(p_bandwidth, bandwidth_allocated),
            updated_at = NOW()
        WHERE id = v_service_id;
    ELSE
        -- THE FIX: If the service doesn't exist, CREATE IT so we don't lose the Bandwidth data!
        IF p_bandwidth IS NOT NULL OR p_link_type_id IS NOT NULL THEN
            INSERT INTO public.services (
                name, node_id, end_node_id, link_type_id, bandwidth_allocated, status
            ) VALUES (
                p_new_name, v_start_node_id, v_end_node_id, p_link_type_id, p_bandwidth, true
            );
        END IF;
    END IF;

    -- 4. Propagate to Logical Fiber Paths (The Reality)
    UPDATE public.logical_fiber_paths
    SET
        path_name = REPLACE(path_name, v_old_name, p_new_name),
        updated_at = NOW()
    WHERE path_name ILIKE '%' || v_old_name || '%';

END;
$$;

GRANT EXECUTE ON FUNCTION public.update_ring_path_configuration(UUID, TEXT, UUID, TEXT, UUID, TEXT, UUID, TEXT) TO authenticated;