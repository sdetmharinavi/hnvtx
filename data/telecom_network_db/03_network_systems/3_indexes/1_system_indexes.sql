-- REFACTORED: Indexes now target the new consolidated tables.

-- Indexes for the generic systems table (unchanged)
create index if not exists idx_systems_node_id on systems (node_id);
-- ...

-- Indexes for system-specific tables
-- ADDED: Indexes for the new consolidated tables
create index if not exists idx_ring_based_systems_ring_area on ring_based_systems (ring_id, maintenance_area_id);
create index if not exists idx_sfp_based_connections_customer on sfp_based_connections (customer_name);

-- REMOVED: Old indexes for cpan_systems and maan_systems/connections are no longer needed.
-- create index idx_cpan_systems_ring_area on cpan_systems (ring_no, area);
-- create index idx_maan_systems_ring_area on maan_systems (ring_no, area);
-- create index idx_maan_connections_customer on maan_connections (customer_name);

-- Indexes for other systems (unchanged)
create index if not exists idx_sdh_systems_make on sdh_systems (make);
-- ...