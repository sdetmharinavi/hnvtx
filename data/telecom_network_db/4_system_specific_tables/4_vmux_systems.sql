-- Dedicated Table for VMUX System Specific Details
create table vmux_systems (
  system_id UUID primary key references systems (id) on delete CASCADE,
  vm_id TEXT
);