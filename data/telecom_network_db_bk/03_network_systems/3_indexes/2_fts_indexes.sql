-- Add GIN indexes for full-text search on Network Systems remark fields
create index idx_systems_remark_fts on systems using gin(to_tsvector('english', remark));
create index idx_system_connections_remark_fts on system_connections using gin(to_tsvector('english', remark));
create index idx_management_ports_remark_fts on management_ports using gin(to_tsvector('english', remark));