-- Apply timestamp triggers to all tables
create trigger trigger_cpan_systems_updated_at before
update on cpan_systems for each row execute function update_updated_at_column();
create trigger trigger_cpan_connections_updated_at before
update on cpan_connections for each row execute function update_updated_at_column();
create trigger trigger_maan_systems_updated_at before
update on maan_systems for each row execute function update_updated_at_column();
create trigger trigger_maan_connections_updated_at before
update on maan_connections for each row execute function update_updated_at_column();
create trigger trigger_sdh_systems_updated_at before
update on sdh_systems for each row execute function update_updated_at_column();
create trigger trigger_sdh_connections_updated_at before
update on sdh_connections for each row execute function update_updated_at_column();
create trigger trigger_vmux_systems_updated_at before
update on vmux_systems for each row execute function update_updated_at_column();
create trigger trigger_vmux_connections_updated_at before
update on vmux_connections for each row execute function update_updated_at_column();
create trigger trigger_systems_updated_at before
update on systems for each row execute function update_updated_at_column();
create trigger trigger_system_connections_updated_at before
update on system_connections for each row execute function update_updated_at_column();
create trigger trigger_management_ports_updated_at before
update on management_ports for each row execute function update_updated_at_column();
create trigger trigger_sdh_node_associations_updated_at before
update on sdh_node_associations for each row execute function update_updated_at_column();