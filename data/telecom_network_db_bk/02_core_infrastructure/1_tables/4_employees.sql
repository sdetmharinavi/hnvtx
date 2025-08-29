-- Employee Master Table
create table employees (
  id UUID primary key default gen_random_uuid(),
  employee_name TEXT not null,
  employee_pers_no TEXT unique,
  employee_contact TEXT,
  employee_email TEXT,
  employee_dob DATE,
  employee_doj DATE,
  employee_designation_id UUID references employee_designations (id),
  employee_addr TEXT,
  maintenance_terminal_id UUID references maintenance_areas (id),
  remark TEXT,
  status BOOLEAN default true,
  created_at timestamp with time zone default NOW(),
  updated_at timestamp with time zone default NOW()
);