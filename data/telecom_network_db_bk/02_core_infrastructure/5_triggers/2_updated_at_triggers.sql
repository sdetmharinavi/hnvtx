-- Apply timestamp triggers to all tables
create trigger trigger_lookup_types_updated_at before
update on lookup_types for each row execute function update_updated_at_column();
create trigger trigger_maintenance_areas_updated_at before
update on maintenance_areas for each row execute function update_updated_at_column();
create trigger trigger_rings_updated_at before
update on rings for each row execute function update_updated_at_column();
create trigger trigger_employee_designations_updated_at before
update on employee_designations for each row execute function update_updated_at_column();
create trigger trigger_employees_updated_at before
update on employees for each row execute function update_updated_at_column();
create trigger trigger_nodes_updated_at before
update on nodes for each row execute function update_updated_at_column();
create trigger trigger_ofc_cables_updated_at before
update on ofc_cables for each row execute function update_updated_at_column();
create trigger trigger_ofc_connections_updated_at before
update on ofc_connections for each row execute function update_updated_at_column();