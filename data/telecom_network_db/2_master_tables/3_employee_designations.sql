-- Employee Designation Table
create table employee_designations (
  id UUID primary key default gen_random_uuid(),
  name TEXT not null unique,
  parent_id UUID references employee_designations(id) on delete set null,
  status BOOLEAN default true,
  created_at timestamp with time zone default NOW(),
  updated_at timestamp with time zone default NOW()
);