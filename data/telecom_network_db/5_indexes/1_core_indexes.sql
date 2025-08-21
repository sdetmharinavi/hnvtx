-- Core indexes
create index idx_nodes_ring_id on nodes (ring_id);
create index idx_nodes_type_id on nodes (node_type_id);
create index idx_nodes_maintenance_area on nodes (maintenance_terminal_id);
create index idx_nodes_coordinates on nodes (latitude, longitude);
create index idx_nodes_status on nodes (status);
create index idx_systems_node_id on systems (node_id);
create index idx_systems_type_id on systems (system_type_id);
create index idx_systems_maintenance_area on systems (maintenance_terminal_id);
create index idx_ofc_connections_ofc_id on ofc_connections (ofc_id);
create index idx_ofc_connections_nodes on ofc_connections (node_a_id, node_b_id);
create index idx_ofc_connections_systems on ofc_connections (system_a_id, system_b_id);
create index idx_system_connections_system_id on system_connections (system_id);
create index idx_system_connections_nodes on system_connections (node_a_id, node_b_id);
create index idx_system_connections_connected_system on system_connections (connected_system_id);