-- Management Network Ports
create table management_ports (
  id UUID primary key default gen_random_uuid(),
  port_no TEXT not null,
  name TEXT,
  node_id UUID references nodes (id),
  system_id UUID references systems (id),
  commissioned_on DATE,
  remark TEXT,
  status BOOLEAN default true,
  created_at timestamp with time zone default NOW(),
  updated_at timestamp with time zone default NOW()
);