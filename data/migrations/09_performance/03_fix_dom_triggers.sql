-- path: data/migrations/09_performance/03_fix_dom_triggers.sql
-- Description: [FIXED] Creates a single, correct trigger to update DOM fields on OTDR changes.

-- 1. Define the new, simplified trigger function
CREATE OR REPLACE FUNCTION public.handle_dom_update_on_otdr_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if the OTDR distance for the Start Node (SN) has changed.
    IF NEW.otdr_distance_sn_km IS DISTINCT FROM OLD.otdr_distance_sn_km THEN
        -- If it changed, update the sn_dom to the current date.
        NEW.sn_dom := CURRENT_DATE;
    END IF;

    -- Check if the OTDR distance for the End Node (EN) has changed.
    IF NEW.otdr_distance_en_km IS DISTINCT FROM OLD.otdr_distance_en_km THEN
        -- If it changed, update the en_dom to the current date.
        NEW.en_dom := CURRENT_DATE;
    END IF;

    -- Return the (potentially modified) NEW record to be written to the table.
    RETURN NEW;
END;
$$;

-- 2. Drop the old, problematic triggers for idempotency
DROP TRIGGER IF EXISTS trigger_update_sn_dom ON public.ofc_connections;
DROP TRIGGER IF EXISTS trigger_update_en_dom ON public.ofc_connections;
DROP TRIGGER IF EXISTS trg_update_ofc_connections_dom ON public.ofc_connections; -- Drop new name too

-- 3. Create and attach the single, correct trigger
CREATE TRIGGER trg_update_ofc_connections_dom
BEFORE UPDATE ON public.ofc_connections
FOR EACH ROW
EXECUTE FUNCTION public.handle_dom_update_on_otdr_change();

COMMENT ON TRIGGER trg_update_ofc_connections_dom ON public.ofc_connections IS 
'Before an update on ofc_connections, this trigger checks if OTDR distance values have changed and updates the corresponding date of measurement (DOM) fields.';