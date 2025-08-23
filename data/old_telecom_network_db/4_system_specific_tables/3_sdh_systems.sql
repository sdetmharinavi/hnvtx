-- Dedicated Table for SDH System Specific Details
create table sdh_systems (
  system_id UUID primary key references systems (id) on delete CASCADE,
  gne TEXT,
  make TEXT
);