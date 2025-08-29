-- =================================================================
-- Indexes for Network Systems Module
-- =================================================================

-- Indexes for the generic systems table
create index idx_systems_node_id on systems (node_id);
create index idx_systems_type_id on systems (system_type_id);
create index idx_systems_maintenance_area on systems (maintenance_terminal_id);

-- Indexes for the generic system_connections table
create index idx_system_connections_system_id on system_connections (system_id);
create index idx_system_connections_nodes on system_connections (sn_id, en_id);
create index idx_system_connections_connected_system on system_connections (connected_system_id);

-- Indexes for system-specific tables
create index idx_cpan_systems_ring_area on cpan_systems (ring_no, area);
create index idx_maan_systems_ring_area on maan_systems (ring_no, area);
create index idx_sdh_systems_make on sdh_systems (make);
create index idx_vmux_systems_vmid on vmux_systems (vm_id);
create index idx_maan_connections_customer on maan_connections (customer_name);
create index idx_sdh_connections_carrier on sdh_connections (carrier);
create index idx_sdh_connections_customers on sdh_connections (a_customer, b_customer);
create index idx_vmux_connections_subscriber on vmux_connections (subscriber);
create index idx_management_ports_port_no on management_ports (port_no);