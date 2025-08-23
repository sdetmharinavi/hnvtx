-- Dedicated Table for CPAN System Specific Details
create table cpan_systems (
  system_id UUID primary key references systems (id) on delete CASCADE,
  ring_no TEXT,
  area TEXT
);