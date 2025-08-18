-- Generic Systems Table (CPAN, MAAN, SDH, VMUX, etc.)
create table systems (
  id UUID primary key default gen_random_uuid(),
  system_type_id UUID references lookup_types (id) not null,
  node_id UUID references nodes (id) not null,
  system_name TEXT,
  ip_address INET,
  maintenance_terminal_id UUID references maintenance_areas (id),
  commissioned_on DATE,
  s_no TEXT,
  remark TEXT,
  status BOOLEAN default true,
  created_at timestamp with time zone default NOW(),
  updated_at timestamp with time zone default NOW()
);