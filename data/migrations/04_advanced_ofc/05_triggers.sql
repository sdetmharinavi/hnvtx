-- Ensure a clean state by dropping any old triggers that might exist.
DROP TRIGGER IF EXISTS on_junction_closure_change ON public.junction_closures;


-- Trigger 1: Cable Segmentation (This one is correct and remains)
CREATE TRIGGER on_junction_closure_change
AFTER INSERT OR UPDATE OR DELETE ON public.junction_closures -- Added UPDATE
FOR EACH ROW
EXECUTE FUNCTION public.manage_cable_segments();
