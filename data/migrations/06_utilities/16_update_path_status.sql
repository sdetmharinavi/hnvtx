-- data/migrations/06_utilities/17_update_path_status.sql

-- Function to update a logical path's status by name (e.g., 'Active', 'Provisioned')
CREATE OR REPLACE FUNCTION public.update_path_operational_status(
    p_path_id UUID,
    p_status_name TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_status_id UUID;
BEGIN
    -- 1. Find the ID for the given status name (Active/Provisioned/etc)
    SELECT id INTO v_status_id
    FROM public.lookup_types
    WHERE category = 'OFC_PATH_STATUS' 
      AND name ILIKE p_status_name
    LIMIT 1;

    IF v_status_id IS NULL THEN
        RAISE EXCEPTION 'Status "%" not found in lookup_types.', p_status_name;
    END IF;

    -- 2. Update the path
    UPDATE public.logical_fiber_paths
    SET operational_status_id = v_status_id, updated_at = NOW()
    WHERE id = p_path_id;
    
    -- 3. Also update the protection path if this is a working path, or vice versa if linked
    -- (Optional logic: usually we want to update the pair)
    UPDATE public.logical_fiber_paths
    SET operational_status_id = v_status_id, updated_at = NOW()
    WHERE working_path_id = p_path_id OR id = (SELECT working_path_id FROM public.logical_fiber_paths WHERE id = p_path_id);

END;
$$;

GRANT EXECUTE ON FUNCTION public.update_path_operational_status(UUID, TEXT) TO authenticated;