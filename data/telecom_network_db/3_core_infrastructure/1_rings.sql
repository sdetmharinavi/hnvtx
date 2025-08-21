-- Ring Master Table
create table rings (
  id UUID primary key default gen_random_uuid(),
  name TEXT not null,
  ring_type_id UUID references lookup_types (id),
  description TEXT,
  maintenance_terminal_id UUID references maintenance_areas (id),
  total_nodes INTEGER default 0,
  status BOOLEAN default true,
  created_at timestamp with time zone default NOW(),
  updated_at timestamp with time zone default NOW()
);