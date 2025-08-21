-- Generic System Connections Table
create table system_connections (
  id UUID primary key default gen_random_uuid(),
  system_id UUID references systems (id) not null,
  sn_id UUID references systems (id),
  en_id UUID references systems (id),
  connected_system_id UUID references systems (id),
  sn_ip INET,
  sn_interface TEXT,
  en_ip INET,
  en_interface TEXT,
  media_type_id UUID references lookup_types (id),
  bandwidth_mbps INTEGER,
  vlan TEXT,
  commissioned_on DATE,
  remark TEXT,
  status BOOLEAN default true,
  created_at timestamp with time zone default NOW(),
  updated_at timestamp with time zone default NOW()
);