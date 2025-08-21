-- Unified OFC (Optical Fiber Cable) Table
create table ofc_cables (
  id UUID primary key default gen_random_uuid(),
  route_name TEXT not null,
  starting_node_id UUID references nodes (id) not null,
  ending_node_id UUID references nodes (id) not null,
  ofc_type_id UUID references lookup_types (id) not null,
  capacity INTEGER not null,
  current_rkm DECIMAL(10, 3),
  transnet_id TEXT,
  transnet_rkm DECIMAL(10, 3),
  asset_no TEXT,
  maintenance_terminal_id UUID references maintenance_areas (id),
  commissioned_on DATE,
  remark TEXT,
  status BOOLEAN default true,
  created_at timestamp with time zone default NOW(),
  updated_at timestamp with time zone default NOW()
);