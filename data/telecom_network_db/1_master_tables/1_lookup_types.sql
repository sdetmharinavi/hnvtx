-- Centralized Lookup Types Table
create table lookup_types (
  id UUID primary key default gen_random_uuid(),
  category TEXT not null,
  name TEXT not null,
  code TEXT,
  description TEXT,
  sort_order INTEGER default 0,
  is_system_default BOOLEAN default false,
  status BOOLEAN default true,
  created_at timestamp with time zone default NOW(),
  updated_at timestamp with time zone default NOW(),
  constraint uq_lookup_types_category_name unique (category, name),
  constraint uq_lookup_types_category_code unique (category, code)
);

create index idx_lookup_types_category on lookup_types (category);
create index idx_lookup_types_name on lookup_types (name);