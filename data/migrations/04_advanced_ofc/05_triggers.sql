-- Ensure a clean state by dropping any old triggers that might exist.
DROP TRIGGER IF EXISTS on_junction_closure_change ON public.junction_closures;
DROP TRIGGER IF EXISTS trigger_update_ofc_connections_on_splice ON public.fiber_splices;


-- Trigger 1: Cable Segmentation (This one is correct and remains)
CREATE TRIGGER on_junction_closure_change
AFTER INSERT OR DELETE ON public.junction_closures
FOR EACH ROW
EXECUTE FUNCTION public.manage_cable_segments();

COMMENT ON TRIGGER on_junction_closure_change ON public.junction_closures
IS 'When a JC is added or removed, this trigger calls a function to recalculate the virtual segments of the affected OFC cable.';


-- Trigger 2: Logical Path Update (RE-ENABLED with correct underlying logic)
-- This trigger is now the single source of truth for all path updates.
CREATE TRIGGER trigger_update_ofc_connections_on_splice
AFTER INSERT OR UPDATE OR DELETE ON public.fiber_splices
FOR EACH ROW
EXECUTE FUNCTION public.update_ofc_connections_from_splice();

COMMENT ON TRIGGER trigger_update_ofc_connections_on_splice ON public.fiber_splices
IS 'After any change to a fiber splice, this calls a function to re-trace and update the logical endpoint information for ALL affected fibers.';