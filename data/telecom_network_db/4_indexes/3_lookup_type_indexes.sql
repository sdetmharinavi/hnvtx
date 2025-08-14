-- Additional indexes for lookup_types usage
create index idx_ofc_cables_type_id on ofc_cables (ofc_type_id);
create index idx_rings_type_id on rings (ring_type_id);
create index idx_maintenance_areas_type_id on maintenance_areas (area_type_id);
create index idx_system_connections_media_type on system_connections (media_type_id);