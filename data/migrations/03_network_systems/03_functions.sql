-- Path: data/migrations/03_network_systems/03_functions.sql
-- Description: Contains functions for the Network Systems module.

-- The function logic is now restructured to handle all system subtypes correctly.
CREATE OR REPLACE FUNCTION public.upsert_system_with_details(
    p_system_name TEXT,
    p_system_type_id UUID,
    p_node_id UUID,
    p_status BOOLEAN,
    p_is_hub BOOLEAN,
    p_maan_node_id TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_maintenance_terminal_id UUID DEFAULT NULL,
    p_commissioned_on DATE DEFAULT NULL,
    p_s_no TEXT DEFAULT NULL,
    p_remark TEXT DEFAULT NULL,
    p_id UUID DEFAULT NULL,
    p_ring_id UUID DEFAULT NULL,
    p_order_in_ring INTEGER DEFAULT NULL,
    p_make TEXT DEFAULT NULL
)
RETURNS SETOF public.systems
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_system_id UUID;
    v_system_type_record public.lookup_types; -- Use a record to hold the full lookup type row
BEGIN
    -- Get the entire lookup_type record to check its properties
    SELECT * INTO v_system_type_record FROM public.lookup_types WHERE id = p_system_type_id;

    -- Step 1: Upsert the main system record
    INSERT INTO public.systems (
        id, system_name, system_type_id,maan_node_id, node_id, ip_address,
        maintenance_terminal_id, commissioned_on, s_no, remark, status, make, is_hub
    ) VALUES (
        COALESCE(p_id, gen_random_uuid()), p_system_name, p_system_type_id,p_maan_node_id, p_node_id, p_ip_address,
        p_maintenance_terminal_id, p_commissioned_on, p_s_no, p_remark, p_status, p_make, p_is_hub
    )
    ON CONFLICT (id) DO UPDATE SET
        system_name = EXCLUDED.system_name,
        system_type_id = EXCLUDED.system_type_id,
        maan_node_id = EXCLUDED.maan_node_id,
        node_id = EXCLUDED.node_id,
        ip_address = EXCLUDED.ip_address,
        maintenance_terminal_id = EXCLUDED.maintenance_terminal_id,
        commissioned_on = EXCLUDED.commissioned_on,
        s_no = EXCLUDED.s_no,
        remark = EXCLUDED.remark,
        status = EXCLUDED.status,
        make = EXCLUDED.make,
        is_hub = EXCLUDED.is_hub,
        updated_at = NOW()
    RETURNING id INTO v_system_id;

    -- Step 2: Handle subtype tables based on the system type's boolean flags.

    -- Handle Ring-Based Systems using the new 'is_ring_based' flag
    IF v_system_type_record.is_ring_based = true THEN
        INSERT INTO public.ring_based_systems (system_id, ring_id, order_in_ring)
        VALUES (v_system_id, p_ring_id, p_order_in_ring)
        ON CONFLICT (system_id) DO UPDATE SET 
            ring_id = EXCLUDED.ring_id,
            order_in_ring = EXCLUDED.order_in_ring;
    END IF;

    -- Return the main system record
    RETURN QUERY SELECT * FROM public.systems WHERE id = v_system_id;
END;
$$;

-- UPDATED GRANT to include the new INTEGER parameter
GRANT EXECUTE ON FUNCTION public.upsert_system_with_details(TEXT, UUID, UUID, BOOLEAN, BOOLEAN, TEXT, INET, UUID, DATE, TEXT, TEXT, UUID, UUID, INTEGER, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.upsert_system_connection_with_details(
    p_system_id UUID, p_media_type_id UUID, p_status BOOLEAN, p_id UUID DEFAULT NULL, p_sn_id UUID DEFAULT NULL,
    p_en_id UUID DEFAULT NULL, p_connected_system_id UUID DEFAULT NULL, p_sn_ip INET DEFAULT NULL,
    p_sn_interface TEXT DEFAULT NULL, p_en_ip INET DEFAULT NULL, p_en_interface TEXT DEFAULT NULL,
    p_bandwidth_mbps INT DEFAULT NULL, p_vlan TEXT DEFAULT NULL, p_commissioned_on DATE DEFAULT NULL,
    p_remark TEXT DEFAULT NULL, p_port TEXT DEFAULT NULL, p_port_type_id UUID DEFAULT NULL,
    p_port_capacity TEXT DEFAULT NULL, p_sfp_serial_no TEXT DEFAULT NULL, p_fiber_in INT DEFAULT NULL,
    p_fiber_out INT DEFAULT NULL, p_customer_name TEXT DEFAULT NULL, p_bandwidth_allocated_mbps INT DEFAULT NULL,
    p_stm_no TEXT DEFAULT NULL, p_carrier TEXT DEFAULT NULL, p_a_slot TEXT DEFAULT NULL,
    p_a_customer TEXT DEFAULT NULL, p_b_slot TEXT DEFAULT NULL, p_b_customer TEXT DEFAULT NULL
)
RETURNS SETOF public.system_connections
LANGUAGE plpgsql
AS $$
DECLARE
    v_connection_id UUID;
    v_system_type_record public.lookup_types;
BEGIN
    SELECT lt.* INTO v_system_type_record FROM public.systems s JOIN public.lookup_types lt ON s.system_type_id = lt.id WHERE s.id = p_system_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Parent system with ID % not found', p_system_id; END IF;

    INSERT INTO public.system_connections (
        id, system_id, media_type_id, status, sn_id, en_id, connected_system_id, sn_ip, sn_interface,
        en_ip, en_interface, bandwidth_mbps, vlan, commissioned_on, remark, updated_at
    ) VALUES (
        COALESCE(p_id, gen_random_uuid()), p_system_id, p_media_type_id, p_status, p_sn_id, p_en_id, p_connected_system_id,
        p_sn_ip, p_sn_interface, p_en_ip, p_en_interface, p_bandwidth_mbps, p_vlan, p_commissioned_on, p_remark, NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        media_type_id = EXCLUDED.media_type_id, status = EXCLUDED.status, sn_id = EXCLUDED.sn_id,
        en_id = EXCLUDED.en_id, connected_system_id = EXCLUDED.connected_system_id, sn_ip = EXCLUDED.sn_ip,
        sn_interface = EXCLUDED.sn_interface, en_ip = EXCLUDED.en_ip, en_interface = EXCLUDED.en_interface,
        bandwidth_mbps = EXCLUDED.bandwidth_mbps, vlan = EXCLUDED.vlan, commissioned_on = EXCLUDED.commissioned_on,
        remark = EXCLUDED.remark, updated_at = NOW()
    RETURNING id INTO v_connection_id;

    IF v_system_type_record.is_ring_based = true THEN
        INSERT INTO public.ports_management (
            system_connection_id, port, port_type_id, port_capacity, sfp_serial_no, fiber_in,
            fiber_out, customer_name, bandwidth_allocated_mbps
        ) VALUES (
            v_connection_id, p_port, p_port_type_id, p_port_capacity, p_sfp_serial_no, p_fiber_in,
            p_fiber_out, p_customer_name, p_bandwidth_allocated_mbps
        ) ON CONFLICT (system_connection_id) DO UPDATE SET
            port = EXCLUDED.port, port_type_id = EXCLUDED.port_type_id, port_capacity = EXCLUDED.port_capacity,
            sfp_serial_no = EXCLUDED.sfp_serial_no, fiber_in = EXCLUDED.fiber_in, fiber_out = EXCLUDED.fiber_out,
            customer_name = EXCLUDED.customer_name, bandwidth_allocated_mbps = EXCLUDED.bandwidth_allocated_mbps;
    END IF;

    -- THE FIX: Check for 'Synchronous' OR 'SDH' to correctly identify all SDH variants.
    IF v_system_type_record.name = 'Plesiochronous Digital Hierarchy' OR v_system_type_record.name = 'Synchronous Digital Hierarchy' OR v_system_type_record.name = 'Next Generation SDH' THEN
        INSERT INTO public.sdh_connections (
            system_connection_id, stm_no, carrier, a_slot, a_customer, b_slot, b_customer
        ) VALUES (
            v_connection_id, p_stm_no, p_carrier, p_a_slot, p_a_customer, p_b_slot, p_b_customer
        ) ON CONFLICT (system_connection_id) DO UPDATE SET
            stm_no = EXCLUDED.stm_no, carrier = EXCLUDED.carrier, a_slot = EXCLUDED.a_slot,
            a_customer = EXCLUDED.a_customer, b_slot = EXCLUDED.b_slot, b_customer = EXCLUDED.b_customer;
    END IF;
    
    RETURN QUERY SELECT * FROM public.system_connections WHERE id = v_connection_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_system_connection_with_details(UUID, UUID, BOOLEAN, UUID, UUID, UUID, UUID, INET, TEXT, INET, TEXT, INT, TEXT, DATE, TEXT, TEXT, UUID, TEXT, TEXT, INT, INT, TEXT, INT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

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

-- NEW FUNCTION: To generate logical connection paths for a given ring
CREATE OR REPLACE FUNCTION public.generate_ring_connection_paths(p_ring_id UUID)
RETURNS SETOF public.logical_paths
LANGUAGE plpgsql
AS $$
DECLARE
    ring_info RECORD;
    node_rec RECORD;
    prev_node_rec RECORD;
    first_node_rec RECORD;
BEGIN
    SELECT * INTO ring_info FROM public.rings WHERE id = p_ring_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ring not found';
    END IF;

    -- Loop through nodes in the ring and create paths
    prev_node_rec := NULL;
    first_node_rec := NULL;

    FOR node_rec IN
        SELECT n.id, n.name
        FROM public.nodes n
        JOIN public.systems s ON n.id = s.node_id
        JOIN public.ring_based_systems rbs ON s.id = rbs.system_id
        WHERE rbs.ring_id = p_ring_id
        -- Order by the specified ring order, not alphabetically
        ORDER BY rbs.order_in_ring 
    LOOP
        IF first_node_rec IS NULL THEN
            first_node_rec := node_rec;
        END IF;

        IF prev_node_rec IS NOT NULL THEN
            INSERT INTO public.logical_paths (name, ring_id, start_node_id, end_node_id)
            VALUES (ring_info.name || ':' || prev_node_rec.name || '-' || node_rec.name, p_ring_id, prev_node_rec.id, node_rec.id)
            ON CONFLICT (ring_id, start_node_id, end_node_id) DO NOTHING;
        END IF;
        prev_node_rec := node_rec;
    END LOOP;

    -- Create final path to close the ring
    IF prev_node_rec IS NOT NULL AND first_node_rec IS NOT NULL AND prev_node_rec.id <> first_node_rec.id THEN
        INSERT INTO public.logical_paths (name, ring_id, start_node_id, end_node_id)
        VALUES (ring_info.name || ':' || prev_node_rec.name || '-' || first_node_rec.name, p_ring_id, prev_node_rec.id, first_node_rec.id)
        ON CONFLICT (ring_id, start_node_id, end_node_id) DO NOTHING;
    END IF;

    RETURN QUERY SELECT * FROM public.logical_paths WHERE ring_id = p_ring_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.generate_ring_connection_paths(UUID) TO authenticated;

-- NEW FUNCTION: Get available cables connected to a specific node
CREATE OR REPLACE FUNCTION public.get_available_cables_for_node(p_node_id UUID)
RETURNS SETOF public.ofc_cables
LANGUAGE sql STABLE
AS $$
  SELECT *
  FROM public.ofc_cables
  WHERE sn_id = p_node_id OR en_id = p_node_id;
$$;
GRANT EXECUTE ON FUNCTION public.get_available_cables_for_node(UUID) TO authenticated;

-- NEW FUNCTION: Get available fibers on a specific cable
CREATE OR REPLACE FUNCTION public.get_available_fibers_for_cable(p_cable_id UUID)
RETURNS TABLE(fiber_no integer)
LANGUAGE sql STABLE
AS $$
  SELECT fiber_no_sn::integer as fiber_no
  FROM public.ofc_connections
  WHERE ofc_id = p_cable_id
    AND system_id IS NULL
    AND status = true
  ORDER BY fiber_no_sn;
$$;
GRANT EXECUTE ON FUNCTION public.get_available_fibers_for_cable(UUID) TO authenticated;

-- NEW FUNCTION: Assign a system to a pair of fibers on a cable
CREATE OR REPLACE FUNCTION public.assign_system_to_fibers(
    p_system_id UUID,
    p_cable_id UUID,
    p_fiber_tx INT,
    p_fiber_rx INT,
    p_logical_path_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    -- Assign system to the fibers
    UPDATE public.ofc_connections
    SET system_id = p_system_id
    WHERE ofc_id = p_cable_id AND (fiber_no_sn = p_fiber_tx OR fiber_no_sn = p_fiber_rx);

    -- Mark the logical path as provisioned
    UPDATE public.logical_paths
    SET status = 'provisioned', updated_at = NOW()
    WHERE id = p_logical_path_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.assign_system_to_fibers(UUID, UUID, INT, INT, UUID) TO authenticated;