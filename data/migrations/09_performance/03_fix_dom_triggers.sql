-- path: data/migrations/09_performance/03_fix_dom_triggers.sql
-- Description: Attaches triggers to auto-update Date of Measurement (DOM) when OTDR values change.

-- 1. Redefine functions to be more robust (removing the 0.05 threshold for manual edits)
CREATE OR REPLACE FUNCTION public.update_sn_dom_on_otdr_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If the distance value has changed (and isn't just null -> null)
  IF NEW.otdr_distance_sn_km IS DISTINCT FROM OLD.otdr_distance_sn_km THEN
      -- Automatically set the measurement date to today
      NEW.sn_dom := CURRENT_DATE;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_en_dom_on_otdr_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If the distance value has changed (and isn't just null -> null)
  IF NEW.otdr_distance_en_km IS DISTINCT FROM OLD.otdr_distance_en_km THEN
      -- Automatically set the measurement date to today
      NEW.en_dom := CURRENT_DATE;
  END IF;
  RETURN NEW;
END;
$$;

-- 2. Drop existing triggers if they exist (cleanup)
DROP TRIGGER IF EXISTS trigger_update_sn_dom ON public.ofc_connections;
DROP TRIGGER IF EXISTS trigger_update_en_dom ON public.ofc_connections;

-- 3. Attach Triggers
CREATE TRIGGER trigger_update_sn_dom
BEFORE UPDATE ON public.ofc_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_sn_dom_on_otdr_change();

CREATE TRIGGER trigger_update_en_dom
BEFORE UPDATE ON public.ofc_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_en_dom_on_otdr_change();