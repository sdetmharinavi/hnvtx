-- Path: data/migrations/03_network_systems/06_functions.sql
-- Description: Contains functions for the Network Systems module.

-- path: data/migrations/03_network_systems/06_functions.sql
-- Description: Contains functions for the Network Systems module.

-- CORRECTED: The function logic is now restructured to handle all system subtypes correctly.
CREATE OR REPLACE FUNCTION public.upsert_system_with_details(
    p_system_name TEXT,
    p_system_type_id UUID,
    p_node_id UUID,
    p_status BOOLEAN,
    p_ip_address INET DEFAULT NULL,
    p_maintenance_terminal_id UUID DEFAULT NULL,
    p_commissioned_on DATE DEFAULT NULL,
    p_s_no TEXT DEFAULT NULL,
    p_remark TEXT DEFAULT NULL,
    p_id UUID DEFAULT NULL,
    p_ring_id UUID DEFAULT NULL,
    p_gne TEXT DEFAULT NULL,
    p_make TEXT DEFAULT NULL,
    p_vm_id TEXT DEFAULT NULL
)
RETURNS SETOF public.systems
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_system_id UUID;
    v_system_type_name TEXT;
BEGIN
    -- Get the name of the system type to determine which subtype table to use
    SELECT name INTO v_system_type_name FROM public.lookup_types WHERE id = p_system_type_id;

    -- Step 1: Upsert the main system record
    INSERT INTO public.systems (
        id, system_name, system_type_id, node_id, ip_address,
        maintenance_terminal_id, commissioned_on, s_no, remark, status
    ) VALUES (
        COALESCE(p_id, gen_random_uuid()), p_system_name, p_system_type_id, p_node_id, p_ip_address,
        p_maintenance_terminal_id, p_commissioned_on, p_s_no, p_remark, p_status
    )
    ON CONFLICT (id) DO UPDATE SET
        system_name = EXCLUDED.system_name,
        system_type_id = EXCLUDED.system_type_id,
        node_id = EXCLUDED.node_id,
        ip_address = EXCLUDED.ip_address,
        maintenance_terminal_id = EXCLUDED.maintenance_terminal_id,
        commissioned_on = EXCLUDED.commissioned_on,
        s_no = EXCLUDED.s_no,
        remark = EXCLUDED.remark,
        status = EXCLUDED.status,
        updated_at = NOW()
    RETURNING id INTO v_system_id;

    -- Step 2: Handle subtype tables based on the system type name.
    -- This logic is now separate and allows for multiple conditions to be met.

    -- Handle Ring-Based Systems (CPAN, MAAN, and SDH variants)
    IF v_system_type_name IN (
      'Next Gen Optical Transport Network', 'Converged Packet Aggregation Node', 'Multi-Access Aggregation Node', 
      'Multiprotocol Label Switching', 'Next Generation SDH', 'Optical Transport Network', 
      'Packet Transport Network', 'Plesiochronous Digital Hierarchy', 'Synchronous Digital Hierarchy'
    ) THEN
        INSERT INTO public.ring_based_systems (system_id, ring_id)
        VALUES (v_system_id, p_ring_id)
        ON CONFLICT (system_id) DO UPDATE SET ring_id = EXCLUDED.ring_id;
    END IF;

    -- Handle SDH-Specific Systems
    IF v_system_type_name IN ('Synchronous Digital Hierarchy', 'Next Generation SDH') THEN
        INSERT INTO public.sdh_systems (system_id, gne, make)
        VALUES (v_system_id, p_gne, p_make)
        ON CONFLICT (system_id) DO UPDATE SET gne = EXCLUDED.gne, make = EXCLUDED.make;
    END IF;
    
    -- Handle VMUX-Specific Systems
    IF v_system_type_name = 'VMUX' THEN
        INSERT INTO public.vmux_systems (system_id, vm_id)
        VALUES (v_system_id, p_vm_id)
        ON CONFLICT (system_id) DO UPDATE SET vm_id = EXCLUDED.vm_id;
    END IF;

    -- Return the main system record
    RETURN QUERY SELECT * FROM public.systems WHERE id = v_system_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_system_with_details(TEXT, UUID, UUID, BOOLEAN, INET, UUID, DATE, TEXT, TEXT, UUID, UUID, TEXT, TEXT, TEXT) TO authenticated;

-- NEW FUNCTION: To manage system associations for a ring
CREATE OR REPLACE FUNCTION public.update_ring_system_associations(
    p_ring_id UUID,
    p_system_ids UUID[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- Use definer to ensure permissions are handled correctly within the function
AS $$
BEGIN
    -- First, delete all existing associations for this ring that are NOT in the provided list.
    DELETE FROM public.ring_based_systems rbs
    WHERE rbs.ring_id = p_ring_id
      AND NOT (rbs.system_id = ANY(p_system_ids));

    -- Second, insert all the new associations.
    -- The ON CONFLICT clause gracefully handles any systems that are already associated,
    -- preventing errors and ensuring the state is consistent.
    INSERT INTO public.ring_based_systems (ring_id, system_id)
    SELECT p_ring_id, unnest(p_system_ids)
    ON CONFLICT (system_id) DO UPDATE
    SET ring_id = EXCLUDED.ring_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_ring_system_associations(UUID, UUID[]) TO authenticated;