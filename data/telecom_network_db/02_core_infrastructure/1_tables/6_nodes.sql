-- Unified Node List (Physical Locations/Sites)
create table nodes (
  id UUID primary key default gen_random_uuid(),
  name TEXT not null,
  node_type_id UUID references lookup_types (id),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  maintenance_terminal_id UUID references maintenance_areas (id),
  remark TEXT,
  status BOOLEAN default true,
  created_at timestamp with time zone default NOW(),
  updated_at timestamp with time zone default NOW()
);