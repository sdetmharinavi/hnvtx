-- Dedicated Table for CPAN Connection Specific Details
create table cpan_connections (
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