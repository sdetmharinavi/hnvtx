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
    -- THE FIX: These parameters now accept arrays from the Excel upload logic.
    p_ring_associations JSONB DEFAULT NULL,
    p_make TEXT DEFAULT NULL,
    p_system_capacity_id UUID DEFAULT NULL
)
RETURNS SETOF public.systems
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_system_id UUID;
    v_system_type_record public.lookup_types;
    ring_assoc_record RECORD;
BEGIN
    -- Get the system type properties
    SELECT * INTO v_system_type_record FROM public.lookup_types WHERE id = p_system_type_id;

    -- Step 1: Upsert the main system record
    INSERT INTO public.systems (
        id, system_name, system_type_id, maan_node_id, node_id, ip_address,
        maintenance_terminal_id, commissioned_on, s_no, remark, status, make, is_hub, system_capacity_id
    ) VALUES (
        COALESCE(p_id, gen_random_uuid()), p_system_name, p_system_type_id, p_maan_node_id, p_node_id, p_ip_address,
        p_maintenance_terminal_id, p_commissioned_on, p_s_no, p_remark, p_status, p_make, p_is_hub, p_system_capacity_id
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
        system_capacity_id = EXCLUDED.system_capacity_id,
        updated_at = NOW()
    RETURNING id INTO v_system_id;

    -- Step 2: Handle ring associations if the system is ring-based and associations are provided.
    IF v_system_type_record.is_ring_based = true AND p_ring_associations IS NOT NULL AND jsonb_array_length(p_ring_associations) > 0 THEN
        -- THE FIX: Removed the bulk DELETE statement here. 
        -- We want to merge/upsert the provided associations without destroying existing ones 
        -- for other rings that aren't part of this payload.
        
        -- Loop through the provided JSON array and insert the new associations.
        FOR ring_assoc_record IN SELECT * FROM jsonb_to_recordset(p_ring_associations) AS x(ring_id UUID, order_in_ring NUMERIC)
        LOOP
            INSERT INTO public.ring_based_systems (system_id, ring_id, order_in_ring)
            VALUES (v_system_id, ring_assoc_record.ring_id, ring_assoc_record.order_in_ring)
            -- This conflict clause handles updates to the order for existing ring associations.
            ON CONFLICT (system_id, ring_id) DO UPDATE SET
                order_in_ring = EXCLUDED.order_in_ring;
        END LOOP;
    END IF;

    -- Return the main system record
    RETURN QUERY SELECT * FROM public.systems WHERE id = v_system_id;
END;
$$;

-- Grant execute on the modified function signature
GRANT EXECUTE ON FUNCTION public.upsert_system_with_details(TEXT, UUID, UUID, BOOLEAN, BOOLEAN, TEXT, INET, UUID, DATE, TEXT, TEXT, UUID, JSONB, TEXT, UUID) TO authenticated;


CREATE OR REPLACE FUNCTION public.upsert_system_connection_with_details(
    p_system_id UUID,
    p_media_type_id UUID,
    p_status BOOLEAN,
    p_id UUID DEFAULT NULL,
    
    -- Service Params (Logical)
    p_service_name TEXT DEFAULT NULL,
    p_link_type_id UUID DEFAULT NULL,
    p_bandwidth_allocated TEXT DEFAULT NULL,
    p_vlan TEXT DEFAULT NULL,
    p_lc_id TEXT DEFAULT NULL,
    p_unique_id TEXT DEFAULT NULL,
    p_service_node_id UUID DEFAULT NULL,
    
    -- Connection Params (Physical)
    p_services_ip INET DEFAULT NULL,      
    p_services_interface TEXT DEFAULT NULL,
    
    -- Topology Params
    p_sn_id UUID DEFAULT NULL,
    p_en_id UUID DEFAULT NULL,
    p_sn_ip INET DEFAULT NULL,
    p_sn_interface TEXT DEFAULT NULL,
    p_en_ip INET DEFAULT NULL,
    p_en_interface TEXT DEFAULT NULL,
    p_bandwidth TEXT DEFAULT NULL,
    p_commissioned_on DATE DEFAULT NULL,
    p_remark TEXT DEFAULT NULL,
    
    p_working_fiber_in_ids UUID[] DEFAULT NULL,
    p_working_fiber_out_ids UUID[] DEFAULT NULL,
    p_protection_fiber_in_ids UUID[] DEFAULT NULL,
    p_protection_fiber_out_ids UUID[] DEFAULT NULL,
    
    p_system_working_interface TEXT DEFAULT NULL,
    p_system_protection_interface TEXT DEFAULT NULL,
    
    -- SDH Params
    p_stm_no TEXT DEFAULT NULL,
    p_carrier TEXT DEFAULT NULL,
    p_a_slot TEXT DEFAULT NULL,
    p_a_customer TEXT DEFAULT NULL,
    p_b_slot TEXT DEFAULT NULL,
    p_b_customer TEXT DEFAULT NULL,

    -- NEW PARAM: Explicit Service Link
    p_service_id UUID DEFAULT NULL,
    p_en_protection_interface TEXT DEFAULT NULL
)
RETURNS SETOF public.system_connections
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_connection_id UUID;
    v_service_id UUID;
    v_system_node_id UUID;
    v_target_node_id UUID;
    v_system_type_record public.lookup_types;
BEGIN
    SELECT s.node_id INTO v_system_node_id 
    FROM public.systems s 
    WHERE s.id = p_system_id;

    IF NOT FOUND THEN RAISE EXCEPTION 'Parent system with ID % not found', p_system_id; END IF;

    SELECT lt.* INTO v_system_type_record 
    FROM public.systems s 
    JOIN public.lookup_types lt ON s.system_type_id = lt.id 
    WHERE s.id = p_system_id;

    -- =================================================================
    -- SERVICE RESOLUTION & UPSERT
    -- =================================================================
    
    -- Priority 1: Use Explicit Service ID if provided (Linking to existing)
    IF p_service_id IS NOT NULL THEN
        v_service_id := p_service_id;
        
        -- Optionally update that service's details if new info is provided
        IF p_service_name IS NOT NULL THEN
            UPDATE public.services SET
                name = p_service_name,
                link_type_id = COALESCE(p_link_type_id, link_type_id),
                bandwidth_allocated = COALESCE(p_bandwidth_allocated, bandwidth_allocated),
                vlan = COALESCE(p_vlan, vlan),
                lc_id = COALESCE(p_lc_id, lc_id),
                unique_id = COALESCE(p_unique_id, unique_id),
                updated_at = NOW()
            WHERE id = v_service_id;
        END IF;

    -- Priority 2: Logic for creating/finding by name if no explicit ID
    ELSIF p_service_name IS NOT NULL THEN
        
        v_target_node_id := COALESCE(p_service_node_id, v_system_node_id);

        -- 2a. Try to find existing service ID from current connection record if editing
        IF p_id IS NOT NULL AND v_service_id IS NULL THEN
            SELECT service_id INTO v_service_id FROM public.system_connections WHERE id = p_id;
        END IF;

        -- 2b. If not found, try to find by Name + Node (Prevent Duplicates at same location)
        IF v_service_id IS NULL THEN
            SELECT id INTO v_service_id 
            FROM public.services 
            WHERE name = p_service_name 
              AND node_id = v_target_node_id
            LIMIT 1;
        END IF;

        -- 2c. Perform Upsert
        IF v_service_id IS NOT NULL THEN
            UPDATE public.services SET
                name = p_service_name,
                link_type_id = COALESCE(p_link_type_id, link_type_id),
                node_id = v_target_node_id,
                bandwidth_allocated = COALESCE(p_bandwidth_allocated, bandwidth_allocated),
                vlan = COALESCE(p_vlan, vlan),
                lc_id = COALESCE(p_lc_id, lc_id),
                unique_id = COALESCE(p_unique_id, unique_id),
                updated_at = NOW()
            WHERE id = v_service_id;
        ELSE
            INSERT INTO public.services (
                node_id, name, link_type_id, bandwidth_allocated, vlan, lc_id, unique_id
            ) VALUES (
                v_target_node_id,
                p_service_name,
                p_link_type_id,
                p_bandwidth_allocated,
                p_vlan,
                p_lc_id,
                p_unique_id
            ) RETURNING id INTO v_service_id;
        END IF;
    END IF;

    -- =================================================================
    -- CONNECTION UPSERT
    -- =================================================================
    INSERT INTO public.system_connections (
        id, system_id, service_id, media_type_id, status, 
        services_ip, services_interface,
        sn_id, en_id, sn_ip, sn_interface, en_ip, en_interface, 
        bandwidth, commissioned_on, remark, 
        working_fiber_in_ids, working_fiber_out_ids, protection_fiber_in_ids, protection_fiber_out_ids,
        system_working_interface, system_protection_interface,en_protection_interface,
        updated_at
    ) VALUES (
        COALESCE(p_id, gen_random_uuid()), p_system_id, v_service_id, p_media_type_id, p_status,
        p_services_ip, p_services_interface,
        p_sn_id, p_en_id, p_sn_ip, p_sn_interface, p_en_ip, p_en_interface,
        p_bandwidth, p_commissioned_on, p_remark,
        p_working_fiber_in_ids, p_working_fiber_out_ids, p_protection_fiber_in_ids, p_protection_fiber_out_ids,
        p_system_working_interface, p_system_protection_interface,p_en_protection_interface,
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        media_type_id = EXCLUDED.media_type_id, 
        service_id = EXCLUDED.service_id,
        status = EXCLUDED.status,
        services_ip = EXCLUDED.services_ip,
        services_interface = EXCLUDED.services_interface,
        sn_id = EXCLUDED.sn_id,
        en_id = EXCLUDED.en_id, 
        sn_ip = EXCLUDED.sn_ip,
        sn_interface = EXCLUDED.sn_interface, 
        en_ip = EXCLUDED.en_ip, 
        en_interface = EXCLUDED.en_interface,
        bandwidth = EXCLUDED.bandwidth, 
        commissioned_on = EXCLUDED.commissioned_on,
        remark = EXCLUDED.remark, 
        working_fiber_in_ids = EXCLUDED.working_fiber_in_ids, 
        working_fiber_out_ids = EXCLUDED.working_fiber_out_ids,
        protection_fiber_in_ids = EXCLUDED.protection_fiber_in_ids, 
        protection_fiber_out_ids = EXCLUDED.protection_fiber_out_ids,
        system_working_interface = EXCLUDED.system_working_interface,
        system_protection_interface = EXCLUDED.system_protection_interface,
        en_protection_interface = EXCLUDED.en_protection_interface,
        updated_at = NOW()
    RETURNING id INTO v_connection_id;
    
    IF v_system_type_record.name IN ('Plesiochronous Digital Hierarchy', 'Synchronous Digital Hierarchy', 'Next Generation SDH') THEN
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

-- Grant execute permission with the exact new signature
GRANT EXECUTE ON FUNCTION public.upsert_system_connection_with_details(
    UUID, UUID, BOOLEAN, UUID, 
    TEXT, UUID, TEXT, TEXT, TEXT, TEXT, UUID, 
    INET, TEXT, 
    UUID, UUID, INET, TEXT, INET, TEXT, TEXT, DATE, TEXT, 
    UUID[], UUID[], UUID[], UUID[], 
    TEXT, TEXT, 
    TEXT, TEXT, TEXT, TEXT, TEXT, TEXT,
    UUID, TEXT 
) TO authenticated;

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

-- Description: Updates the path generation logic to remove stale paths when ring topology changes.

-- path: data/migrations/06_utilities/21_fix_logical_path_constraint.sql
-- Description: Changes logical path uniqueness from Node-based to System-based to allow multiple systems per node in a ring.

-- 1. Drop the old node-based constraint
ALTER TABLE public.logical_paths 
DROP CONSTRAINT IF EXISTS uq_ring_path;

-- 2. Add new system-based constraint
-- This ensures distinct paths for distinct systems, even if they are at the same location.
ALTER TABLE public.logical_paths
ADD CONSTRAINT uq_ring_system_path 
UNIQUE (ring_id, source_system_id, destination_system_id);


-- 3. Update the generator function to respect System IDs
CREATE OR REPLACE FUNCTION public.generate_ring_connection_paths(p_ring_id UUID)
RETURNS SETOF public.logical_paths
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    ring_info RECORD;
    
    -- Variables for Backbone Loop
    hub_nodes RECORD;
    prev_hub RECORD;
    first_hub RECORD;
    
    -- Variables for Spur Loop
    spur_rec RECORD;
    parent_hub_id UUID;
    parent_node_id UUID;
    parent_node_name TEXT;

    -- Track valid SYSTEM pairs (not node pairs)
    valid_system_pairs TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- 1. Get Ring Info
    SELECT * INTO ring_info FROM public.rings WHERE id = p_ring_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ring not found';
    END IF;

    -- ==========================================
    -- PHASE 1: GENERATE BACKBONE (Hub to Hub)
    -- ==========================================
    prev_hub := NULL;
    first_hub := NULL;

    FOR hub_nodes IN
        SELECT s.id as system_id, n.id as node_id, n.name as node_name, rbs.order_in_ring, s.system_name
        FROM public.ring_based_systems rbs
        JOIN public.systems s ON rbs.system_id = s.id
        JOIN public.nodes n ON s.node_id = n.id
        WHERE rbs.ring_id = p_ring_id AND s.is_hub = true
        ORDER BY rbs.order_in_ring ASC
    LOOP
        IF first_hub IS NULL THEN
            first_hub := hub_nodes;
        END IF;

        IF prev_hub IS NOT NULL THEN
            -- Connect Previous Hub System to Current Hub System
            INSERT INTO public.logical_paths (
                name, ring_id, 
                start_node_id, end_node_id, 
                source_system_id, destination_system_id
            )
            VALUES (
                -- Naming includes System Names now to be specific
                ring_info.name || ': ' || prev_hub.system_name || ' -> ' || hub_nodes.system_name, 
                p_ring_id, 
                prev_hub.node_id, hub_nodes.node_id,
                prev_hub.system_id, hub_nodes.system_id
            )
            -- Conflict check is now on SYSTEMS
            ON CONFLICT (ring_id, source_system_id, destination_system_id) DO NOTHING;
            
            -- Track valid system pair
            valid_system_pairs := array_append(valid_system_pairs, prev_hub.system_id || '_' || hub_nodes.system_id);
        END IF;
        
        prev_hub := hub_nodes;
    END LOOP;

    -- Close the Loop (Last Hub -> First Hub)
    -- Allow closing loop even if nodes are same, provided systems are different (though unlikely in a ring, usually distinct)
    IF ring_info.is_closed_loop AND prev_hub IS NOT NULL AND first_hub IS NOT NULL AND prev_hub.system_id <> first_hub.system_id THEN
        INSERT INTO public.logical_paths (
            name, ring_id, 
            start_node_id, end_node_id,
            source_system_id, destination_system_id
        )
        VALUES (
            ring_info.name || ': ' || prev_hub.system_name || ' -> ' || first_hub.system_name, 
            p_ring_id, 
            prev_hub.node_id, first_hub.node_id,
            prev_hub.system_id, first_hub.system_id
        )
        ON CONFLICT (ring_id, source_system_id, destination_system_id) DO NOTHING;
        
        valid_system_pairs := array_append(valid_system_pairs, prev_hub.system_id || '_' || first_hub.system_id);
    END IF;

    -- ==========================================
    -- PHASE 2: GENERATE SPURS (Parent -> Spur)
    -- ==========================================
    FOR spur_rec IN
        SELECT s.id as system_id, n.id as node_id, n.name as node_name, rbs.order_in_ring, s.system_name
        FROM public.ring_based_systems rbs
        JOIN public.systems s ON rbs.system_id = s.id
        JOIN public.nodes n ON s.node_id = n.id
        WHERE rbs.ring_id = p_ring_id AND s.is_hub = false
    LOOP
        -- Find the parent hub (The hub with order = floor(spur.order))
        parent_hub_id := NULL; 
        
        SELECT s.id, n.id, s.system_name INTO parent_hub_id, parent_node_id, parent_node_name
        FROM public.ring_based_systems rbs
        JOIN public.systems s ON rbs.system_id = s.id
        JOIN public.nodes n ON s.node_id = n.id
        WHERE rbs.ring_id = p_ring_id 
          AND s.is_hub = true 
          AND rbs.order_in_ring = floor(spur_rec.order_in_ring)
        LIMIT 1;

        IF parent_hub_id IS NOT NULL THEN
            -- Connect Parent Hub System -> Spur System
            INSERT INTO public.logical_paths (
                name, ring_id, 
                start_node_id, end_node_id,
                source_system_id, destination_system_id
            )
            VALUES (
                ring_info.name || ' (Spur): ' || parent_node_name || ' -> ' || spur_rec.system_name, 
                p_ring_id, 
                parent_node_id, spur_rec.node_id,
                parent_hub_id, spur_rec.system_id
            )
            ON CONFLICT (ring_id, source_system_id, destination_system_id) DO NOTHING;
            
            valid_system_pairs := array_append(valid_system_pairs, parent_hub_id || '_' || spur_rec.system_id);
        END IF;
    END LOOP;

    -- ==========================================
    -- PHASE 3: CLEANUP STALE PATHS
    -- ==========================================
    -- Remove paths that are NOT in the valid_system_pairs list AND are not provisioned.
    -- Check against source_system_id and destination_system_id
    
    DELETE FROM public.logical_paths
    WHERE ring_id = p_ring_id
      AND (source_system_id || '_' || destination_system_id) != ALL(valid_system_pairs)
      -- Important: Only delete if not actively provisioned (safety check)
      AND (status IS NULL OR status = 'unprovisioned');

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