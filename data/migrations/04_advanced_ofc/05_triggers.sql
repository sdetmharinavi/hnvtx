-- Path: migrations/04_advanced_ofc/04_triggers.sql
-- Description: Attaches 'updated_at' triggers and cable segmentation triggers for the Advanced OFC module.
-- Drop all old triggers to ensure a clean state
DROP TRIGGER IF EXISTS trigger_junction_closures_create_segments ON public.junction_closures;
DROP TRIGGER IF EXISTS trigger_junction_closures_delete_segments ON public.junction_closures;
DROP TRIGGER IF EXISTS on_junction_closure_change ON public.junction_closures;

-- Attach the single, unified trigger for both INSERT and DELETE events.
CREATE TRIGGER on_junction_closure_change
AFTER INSERT OR DELETE ON public.junction_closures
FOR EACH ROW
EXECUTE FUNCTION public.trigger_manage_cable_segments();

-- Keep the other 'updated_at' triggers
CREATE OR REPLACE TRIGGER trigger_junction_closures_updated_at BEFORE UPDATE ON public.junction_closures FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER trigger_logical_fiber_paths_updated_at BEFORE UPDATE ON public.logical_fiber_paths FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER trigger_logical_path_segments_updated_at BEFORE UPDATE ON public.logical_path_segments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER trigger_fiber_splices_updated_at BEFORE UPDATE ON public.fiber_splices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();