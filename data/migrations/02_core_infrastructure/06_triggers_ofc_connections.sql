-- Path: migrations/02_core_infrastructure/07_triggers_ofc_connections.sql
-- Description: Creates a trigger to automatically populate ofc_connections when a new ofc_cable is inserted.

-- 1. Define the trigger function
CREATE OR REPLACE FUNCTION public.create_initial_connections_for_cable()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Use definer to ensure it can write to ofc_connections
SET search_path = public
AS $$
DECLARE
    i INT;
BEGIN
    -- Loop from 1 to the capacity of the newly inserted cable
    FOR i IN 1..NEW.capacity LOOP
        -- Insert a new record into ofc_connections for each fiber
        INSERT INTO public.ofc_connections (
            ofc_id,
            fiber_no_sn,
            fiber_no_en,
            -- Populate with initial logical path info
            updated_fiber_no_sn,
            updated_fiber_no_en,
            updated_sn_id,
            updated_en_id
        )
        VALUES (
            NEW.id,      -- Cable ID
            i,           -- Start fiber number
            i,           -- End fiber number
            -- Initial logical path matches the physical path
            i,           -- updated_fiber_no_sn
            i,           -- updated_fiber_no_en
            NEW.sn_id,   -- updated_sn_id
            NEW.en_id    -- updated_en_id
        );
    END LOOP;
    RETURN NEW;
END;
$$;

-- 2. Create and attach the trigger to the ofc_cables table
DROP TRIGGER IF EXISTS on_ofc_cable_created ON public.ofc_cables; -- for idempotency
CREATE TRIGGER on_ofc_cable_created
AFTER INSERT ON public.ofc_cables
FOR EACH ROW
EXECUTE FUNCTION public.create_initial_connections_for_cable();

COMMENT ON TRIGGER on_ofc_cable_created ON public.ofc_cables IS 'Automatically creates individual fiber records in ofc_connections upon the creation of a new ofc_cable.';