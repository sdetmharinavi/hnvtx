-- Path: supabase/migrations/03_network_systems/04_triggers.sql
-- Description: Attaches 'updated_at' triggers to all tables in the Network Systems module.

CREATE OR REPLACE TRIGGER trigger_systems_updated_at BEFORE UPDATE ON public.systems FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER trigger_system_connections_updated_at BEFORE UPDATE ON public.system_connections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER trigger_management_ports_updated_at BEFORE UPDATE ON public.management_ports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER trigger_ring_based_systems_updated_at BEFORE UPDATE ON public.ring_based_systems FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER trigger_sfp_based_connections_updated_at BEFORE UPDATE ON public.sfp_based_connections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER trigger_sdh_systems_updated_at BEFORE UPDATE ON public.sdh_systems FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER trigger_sdh_connections_updated_at BEFORE UPDATE ON public.sdh_connections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER trigger_sdh_node_associations_updated_at BEFORE UPDATE ON public.sdh_node_associations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER trigger_vmux_systems_updated_at BEFORE UPDATE ON public.vmux_systems FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER trigger_vmux_connections_updated_at BEFORE UPDATE ON public.vmux_connections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();