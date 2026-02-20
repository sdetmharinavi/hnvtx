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
BEGIN
    -- 1. Get current state
    SELECT name, status INTO v_old_name, v_old_status
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
    -- If a service exists with the OLD name, update it.
    -- If not, and we have enough info, try to create/link one.
    
    -- Try to update existing service by exact name match
    UPDATE public.services
    SET
        name = p_new_name,
        link_type_id = COALESCE(p_link_type_id, link_type_id),
        bandwidth_allocated = COALESCE(p_bandwidth, bandwidth_allocated),
        updated_at = NOW()
    WHERE name = v_old_name;

    -- 4. Propagate to Logical Fiber Paths (The Reality)
    -- Update provisioned paths that roughly matched the old name description
    -- We match based on the substring pattern often used "RingName: ... "
    UPDATE public.logical_fiber_paths
    SET
        path_name = REPLACE(path_name, v_old_name, p_new_name),
        bandwidth_gbps = CASE 
            WHEN p_bandwidth ~ '^\d+$' THEN p_bandwidth::INT 
            ELSE bandwidth_gbps 
        END,
        updated_at = NOW()
    WHERE path_name ILIKE '%' || v_old_name || '%';

    -- 5. Note: System Connections and OFC Connections linked to the Service or Fiber Path
    -- will automatically reflect these changes because they link via ID, and we just updated the
    -- 'name' fields on those ID records (Service/LogicalFiberPath).
    
    -- However, if System Connections copied the 'service_name' as a text snapshot (legacy),
    -- we might need to update that too if your schema does that.
    -- Based on provided schema `v_system_connections_complete`, it joins `services`, so it's safe.

END;
$$;

GRANT EXECUTE ON FUNCTION public.update_ring_path_configuration(UUID, TEXT, UUID, TEXT, UUID, TEXT, UUID, TEXT) TO authenticated;
