-- Path: supabase/migrations/04_advanced_ofc/04_triggers.sql
-- Description: Attaches 'updated_at' triggers for the Advanced OFC module.

CREATE OR REPLACE TRIGGER trigger_junction_closures_updated_at BEFORE UPDATE ON public.junction_closures FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER trigger_fiber_joints_updated_at BEFORE UPDATE ON public.fiber_joints FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER trigger_logical_fiber_paths_updated_at BEFORE UPDATE ON public.logical_fiber_paths FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER trigger_logical_path_segments_updated_at BEFORE UPDATE ON public.logical_path_segments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER trigger_fiber_splices_updated_at BEFORE UPDATE ON public.fiber_splices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();