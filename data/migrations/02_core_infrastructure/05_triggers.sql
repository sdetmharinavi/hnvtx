-- Path: migrations/02_core_infrastructure/05_triggers.sql
-- Description: Attaches all triggers for the Core Infrastructure module.

-- Apply the generic 'update_updated_at_column' trigger to all relevant tables.
CREATE OR REPLACE TRIGGER trigger_lookup_types_updated_at BEFORE UPDATE ON public.lookup_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER trigger_maintenance_areas_updated_at BEFORE UPDATE ON public.maintenance_areas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER trigger_rings_updated_at BEFORE UPDATE ON public.rings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER trigger_employee_designations_updated_at BEFORE UPDATE ON public.employee_designations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER trigger_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER trigger_nodes_updated_at BEFORE UPDATE ON public.nodes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER trigger_ofc_cables_updated_at BEFORE UPDATE ON public.ofc_cables FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER trigger_ofc_connections_updated_at BEFORE UPDATE ON public.ofc_connections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Apply the specific DOM update triggers to the ofc_connections table.
CREATE OR REPLACE TRIGGER trigger_update_sn_dom_on_otdr_change BEFORE UPDATE ON public.ofc_connections FOR EACH ROW EXECUTE FUNCTION public.update_sn_dom_on_otdr_change();
CREATE OR REPLACE TRIGGER trigger_update_en_dom_on_otdr_change BEFORE UPDATE ON public.ofc_connections FOR EACH ROW EXECUTE FUNCTION public.update_en_dom_on_otdr_change();