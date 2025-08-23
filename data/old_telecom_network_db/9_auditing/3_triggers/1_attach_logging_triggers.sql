--===== telecom_network_db/12_auditing/3_triggers/1_attach_logging_triggers.sql =====
--===== telecom_network_db/12_auditing/3_triggers/1_attach_logging_triggers.sql =====

-- Attaching log trigger to User Profiles
CREATE TRIGGER user_profiles_log_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION public.log_data_changes();

-- Attaching log trigger to Core Infrastructure Tables
CREATE TRIGGER nodes_log_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.nodes
FOR EACH ROW EXECUTE FUNCTION public.log_data_changes();

CREATE TRIGGER rings_log_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.rings
FOR EACH ROW EXECUTE FUNCTION public.log_data_changes();

CREATE TRIGGER systems_log_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.systems
FOR EACH ROW EXECUTE FUNCTION public.log_data_changes();

CREATE TRIGGER ofc_cables_log_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.ofc_cables
FOR EACH ROW EXECUTE FUNCTION public.log_data_changes();

-- Attaching log trigger to Connection Tables
CREATE TRIGGER ofc_connections_log_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.ofc_connections
FOR EACH ROW EXECUTE FUNCTION public.log_data_changes();

CREATE TRIGGER system_connections_log_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.system_connections
FOR EACH ROW EXECUTE FUNCTION public.log_data_changes();

-- Attaching log trigger to Master Data
CREATE TRIGGER maintenance_areas_log_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.maintenance_areas
FOR EACH ROW EXECUTE FUNCTION public.log_data_changes();

-- Attaching log trigger to system specific Tables
CREATE TRIGGER cpan_systems_log_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.cpan_systems
FOR EACH ROW EXECUTE FUNCTION public.log_data_changes();

CREATE TRIGGER maan_systems_log_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.maan_systems
FOR EACH ROW EXECUTE FUNCTION public.log_data_changes();


CREATE TRIGGER sdh_systems_log_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.sdh_systems
FOR EACH ROW EXECUTE FUNCTION public.log_data_changes();

CREATE TRIGGER vmux_systems_log_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.vmux_systems
FOR EACH ROW EXECUTE FUNCTION public.log_data_changes();

CREATE TRIGGER cpan_connections_log_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.cpan_connections
FOR EACH ROW EXECUTE FUNCTION public.log_data_changes();

CREATE TRIGGER maan_connections_log_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.maan_connections
FOR EACH ROW EXECUTE FUNCTION public.log_data_changes();


CREATE TRIGGER sdh_connections_log_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.sdh_connections
FOR EACH ROW EXECUTE FUNCTION public.log_data_changes();

CREATE TRIGGER vmux_connections_log_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.vmux_connections
FOR EACH ROW EXECUTE FUNCTION public.log_data_changes();
