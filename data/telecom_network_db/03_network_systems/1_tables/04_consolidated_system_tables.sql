-- REFACTORED: This file replaces the redundant cpan_systems, maan_systems, cpan_connections, and maan_connections tables.

-- New Consolidated Table for Ring-Based System Details (replaces cpan_systems and maan_systems)
create table ring_based_systems (
  system_id UUID primary key references systems (id) on delete CASCADE,
  ring_id UUID references rings (id),
  maintenance_area_id UUID references maintenance_areas (id)
);

-- New Consolidated Table for SFP-Based Connection Details (replaces cpan_connections and maan_connections)
create table sfp_based_connections (
  system_connection_id UUID primary key references system_connections (id) on delete CASCADE,
  sfp_port TEXT,
  sfp_type_id UUID references lookup_types (id),
  sfp_capacity TEXT,
  sfp_serial_no TEXT,
  fiber_in INTEGER,
  fiber_out INTEGER,
  customer_name TEXT,
  bandwidth_allocated_mbps INTEGER
);

-- NOTE: The following tables have been removed and replaced by the consolidated tables above:
-- cpan_systems, maan_systems, cpan_connections, maan_connections.