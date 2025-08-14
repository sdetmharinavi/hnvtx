-- Trigger for ofc_connections table to apply dom update logic
create trigger trigger_update_ea_dom_on_otdr_change before update on ofc_connections for each row execute function update_ea_dom_on_otdr_change();
create trigger trigger_update_eb_dom_on_otdr_change before update on ofc_connections for each row execute function update_eb_dom_on_otdr_change();