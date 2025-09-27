-- Path: data/migrations/03_network_systems/06_functions.sql
-- Description: Contains functions for the Network Systems module.

CREATE OR REPLACE FUNCTION public.upsert_system_with_details(
    p_system_name TEXT,
    p_system_type_id UUID,
    p_node_id UUID,
    p_ip_address INET,
    p_maintenance_terminal_id UUID,
    p_commissioned_on DATE,
    p_s_no TEXT,
    p_remark TEXT,
    p_status BOOLEAN,
    p_id UUID DEFAULT NULL,
    -- Subtype fields (optional)
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

    -- Step 2: Based on system type, upsert into the correct subtype table
    IF v_system_type_name IN ('CPAN', 'MAAN') THEN
        INSERT INTO public.ring_based_systems (system_id, ring_id)
        VALUES (v_system_id, p_ring_id)
        ON CONFLICT (system_id) DO UPDATE SET ring_id = EXCLUDED.ring_id;
    ELSIF v_system_type_name = 'SDH' THEN
        INSERT INTO public.sdh_systems (system_id, gne, make)
        VALUES (v_system_id, p_gne, p_make)
        ON CONFLICT (system_id) DO UPDATE SET gne = EXCLUDED.gne, make = EXCLUDED.make;
    ELSIF v_system_type_name = 'VMUX' THEN
        INSERT INTO public.vmux_systems (system_id, vm_id)
        VALUES (v_system_id, p_vm_id)
        ON CONFLICT (system_id) DO UPDATE SET vm_id = EXCLUDED.vm_id;
    END IF;

    -- Return the upserted system record
    RETURN QUERY SELECT * FROM public.systems WHERE id = v_system_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_system_with_details(TEXT, UUID, UUID, INET, UUID, DATE, TEXT, TEXT, BOOLEAN, UUID, UUID, TEXT, TEXT, TEXT) TO authenticated;