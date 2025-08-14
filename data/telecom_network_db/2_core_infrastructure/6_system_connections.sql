-- Generic System Connections Table
create table system_connections (
  id UUID primary key default gen_random_uuid(),
  system_id UUID references systems (id) not null,
  node_a_id UUID references nodes (id),
  node_b_id UUID references nodes (id),
  connected_system_id UUID references systems (id),
  ea_ip INET,
  ea_interface TEXT,
  eb_ip INET,
  eb_interface TEXT,
  media_type_id UUID references lookup_types (id),
  bandwidth_mbps INTEGER,
  vlan TEXT,
  commissioned_on DATE,
  remark TEXT,
  status BOOLEAN default true,
  created_at timestamp with time zone default NOW(),
  updated_at timestamp with time zone default NOW()
);