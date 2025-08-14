-- Dedicated Table for SDH Connection Specific Details
create table sdh_connections (
  system_connection_id UUID primary key references system_connections (id) on delete CASCADE,
  stm_no TEXT,
  carrier TEXT,
  a_slot TEXT,
  a_customer TEXT,
  b_slot TEXT,
  b_customer TEXT
);