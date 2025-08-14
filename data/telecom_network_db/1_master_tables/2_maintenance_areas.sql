-- Maintenance Areas/Terminals Master Table
create table maintenance_areas (
  id UUID primary key default gen_random_uuid(),
  name TEXT not null,
  code TEXT unique,
  area_type_id UUID references lookup_types (id),
  parent_id UUID references maintenance_areas (id),
  contact_person TEXT,
  contact_number TEXT,
  email TEXT,
  latitude TEXT,
  longitude TEXT,
  address TEXT,
  status BOOLEAN default true,
  created_at timestamp with time zone default NOW(),
  updated_at timestamp with time zone default NOW()
);