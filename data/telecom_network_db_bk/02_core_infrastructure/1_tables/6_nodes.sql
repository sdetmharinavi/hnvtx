-- Unified Node List (Physical Locations/Sites)
create table nodes (
  id UUID primary key default gen_random_uuid(),
  name TEXT not null,
  node_type_id UUID references lookup_types (id),
  ip_address INET,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  vlan TEXT,
  site_id TEXT,
  builtup TEXT,
  maintenance_terminal_id UUID references maintenance_areas (id),
  ring_id UUID references rings (id),
  order_in_ring INTEGER,
  ring_status TEXT default 'ACTIVE',
  east_port TEXT,
  west_port TEXT,
  remark TEXT,
  status BOOLEAN default true,
  created_at timestamp with time zone default NOW(),
  updated_at timestamp with time zone default NOW()
);