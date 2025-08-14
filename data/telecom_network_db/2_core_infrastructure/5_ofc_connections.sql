-- OFC Connection Details (Fiber connections between nodes)
create table ofc_connections (
  id UUID primary key default gen_random_uuid(),
  ofc_id UUID references ofc_cables (id) not null,
  node_a_id UUID references nodes (id) not null,
  fiber_no_ea INTEGER,
  otdr_distance_ea_km DECIMAL(10, 3),
  ea_dom DATE,
  ea_power_dbm DECIMAL(10, 3),
  system_a_id UUID references systems (id),
  node_b_id UUID references nodes (id) not null,
  fiber_no_eb INTEGER,
  otdr_distance_eb_km DECIMAL(10, 3),
  eb_dom DATE,
  eb_power_dbm DECIMAL(10, 3),
  route_loss_db DECIMAL(10, 3),
  system_b_id UUID references systems (id),
  remark TEXT,
  status BOOLEAN default true,
  created_at timestamp with time zone default NOW(),
  updated_at timestamp with time zone default NOW()
);