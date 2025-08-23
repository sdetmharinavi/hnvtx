-- Indexes for new specific system/connection tables
create index idx_cpan_systems_ring_area on cpan_systems (ring_no, area);
create index idx_maan_systems_ring_area on maan_systems (ring_no, area);
create index idx_sdh_systems_make on sdh_systems (make);
create index idx_vmux_systems_vmid on vmux_systems (vm_id);
create index idx_maan_connections_customer on maan_connections (customer_name);
create index idx_sdh_connections_carrier on sdh_connections (carrier);
create index idx_sdh_connections_customers on sdh_connections (a_customer, b_customer);
create index idx_vmux_connections_subscriber on vmux_connections (subscriber);
create index idx_management_ports_port_no on management_ports (port_no);