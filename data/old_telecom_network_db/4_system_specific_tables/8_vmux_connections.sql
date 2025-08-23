-- Dedicated Table for VMUX Connection Specific Details
create table vmux_connections (
  system_connection_id UUID primary key references system_connections (id) on delete CASCADE,
  subscriber TEXT,
  c_code TEXT,
  channel TEXT,
  tk TEXT
);