-- REFACTORED: This function now correctly uses the p_physical_path_id parameter
-- to identify which segments to update, making it robust and accurate.
CREATE OR REPLACE FUNCTION public.provision_ring_path(
    p_system_id UUID,
    p_path_name TEXT,
    p_working_fiber_no INT,
    p_protection_fiber_no INT,
    p_physical_path_id UUID
) RETURNS TABLE(working_path_id UUID, protection_path_id UUID) AS $$
DECLARE
    v_working_path_id UUID;
    v_protection_path_id UUID;
    v_active_status_id UUID;
BEGIN
    -- Step 0: Get the UUID for the 'active' status.
    SELECT id INTO v_active_status_id
    FROM public.lookup_types
    WHERE category = 'OFC_PATH_STATUSES' AND name = 'active'
    LIMIT 1;

    IF v_active_status_id IS NULL THEN
        RAISE EXCEPTION 'Operational status "active" not found in lookup_types table.';
    END IF;

    -- Step 1 & 2: Create the "Working" and "Protection" logical paths.
    INSERT INTO public.logical_fiber_paths (path_name, source_system_id, path_role, operational_status_id)
    VALUES (p_path_name || ' (Working)', p_system_id, 'working', v_active_status_id)
    RETURNING id INTO v_working_path_id;

    INSERT INTO public.logical_fiber_paths (path_name, source_system_id, path_role, working_path_id, operational_status_id)
    VALUES (p_path_name || ' (Protection)', p_system_id, 'protection', v_working_path_id, v_active_status_id)
    RETURNING id INTO v_protection_path_id;

    -- Step 3: Provision the WORKING fiber across all segments of the PROVIDED physical path.
    UPDATE public.ofc_connections
    SET 
        logical_path_id = v_working_path_id,
        fiber_role = 'working'
    WHERE
        fiber_no_sn = p_working_fiber_no
        AND ofc_id IN (
            SELECT lps.ofc_cable_id FROM logical_path_segments lps
            WHERE lps.logical_path_id = p_physical_path_id -- CORRECTED: Use the passed-in ID
        );

    -- Step 4: Provision the PROTECTION fiber across all segments.
    UPDATE public.ofc_connections
    SET 
        logical_path_id = v_protection_path_id,
        fiber_role = 'protection'
    WHERE
        fiber_no_sn = p_protection_fiber_no
        AND ofc_id IN (
            SELECT lps.ofc_cable_id FROM logical_path_segments lps
            WHERE lps.logical_path_id = p_physical_path_id -- CORRECTED: Use the passed-in ID
        );

    RETURN QUERY SELECT v_working_path_id, v_protection_path_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION public.provision_ring_path(UUID, TEXT, INT, INT, UUID) TO authenticated;