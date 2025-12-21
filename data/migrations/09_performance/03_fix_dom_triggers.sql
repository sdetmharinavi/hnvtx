
CREATE OR REPLACE FUNCTION public.update_dom_on_otdr_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    old_val NUMERIC;
    new_val NUMERIC;
    date_col_name TEXT;
BEGIN
    -- Get arguments passed from the trigger definition
    date_col_name := TG_ARGV[1]; -- e.g., 'sn_dom' or 'en_dom'

    -- Use EXECUTE to dynamically get OLD and NEW values for the specified columns
    EXECUTE format('SELECT ($1).%I, ($2).%I', TG_ARGV[0], TG_ARGV[0])
    INTO old_val, new_val
    USING OLD, NEW;

    IF new_val IS DISTINCT FROM old_val THEN
        -- Use EXECUTE to dynamically set the new date value
        EXECUTE format('SELECT jsonb_set(to_jsonb($1), ''{%s}'', to_jsonb(CURRENT_DATE))', date_col_name)
        INTO NEW
        USING NEW;
    END IF;
    RETURN NEW;
END;
$$;

-- This would be in a separate trigger file, e.g., 02_core_infrastructure/06_triggers.sql
-- NOTE: This replaces the functions in 09_performance/03_fix_dom_triggers.sql
DROP TRIGGER IF EXISTS trigger_update_sn_dom ON public.ofc_connections;
CREATE TRIGGER trigger_update_sn_dom
BEFORE UPDATE ON public.ofc_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_dom_on_otdr_change('otdr_distance_sn_km', 'sn_dom');

DROP TRIGGER IF EXISTS trigger_update_en_dom ON public.ofc_connections;
CREATE TRIGGER trigger_update_en_dom
BEFORE UPDATE ON public.ofc_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_dom_on_otdr_change('otdr_distance_en_km', 'en_dom');