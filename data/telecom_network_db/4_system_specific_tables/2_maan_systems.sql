-- Dedicated Table for MAAN System Specific Details
create table maan_systems (
  system_id UUID primary key references systems (id) on delete CASCADE,
  ring_no TEXT,
  area TEXT
);