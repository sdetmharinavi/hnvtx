-- path: data/migrations/04_advanced_ofc/05_triggers.sql
-- Description: Attaches 'updated_at' triggers, segmentation, and splice update triggers. [CORRECTED]

-- Drop all old triggers to ensure a clean state
DROP TRIGGER IF EXISTS on_junction_closure_change ON public.junction_closures;
DROP TRIGGER IF EXISTS trigger_after_splice_change ON public.fiber_splices;

-- Attach the single, unified trigger for both INSERT and DELETE events on junction_closures.
CREATE TRIGGER on_junction_closure_change
AFTER INSERT OR DELETE ON public.junction_closures
FOR EACH ROW
EXECUTE FUNCTION public.manage_cable_segments();

-- **The trigger that updates ofc_connections after a splice change.**
CREATE TRIGGER trigger_after_splice_change
AFTER INSERT OR UPDATE OR DELETE ON public.fiber_splices
FOR EACH ROW
EXECUTE FUNCTION public.update_ofc_connections_from_splice();
