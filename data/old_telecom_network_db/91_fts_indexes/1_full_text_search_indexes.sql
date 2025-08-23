-- Add GIN indexes for full-text search on remark fields
create index idx_employees_remark_fts on employees using gin(to_tsvector('english', remark));
create index idx_nodes_remark_fts on nodes using gin(to_tsvector('english', remark));
create index idx_ofc_cables_remark_fts on ofc_cables using gin(to_tsvector('english', remark));
create index idx_systems_remark_fts on systems using gin(to_tsvector('english', remark));
create index idx_ofc_connections_remark_fts on ofc_connections using gin(to_tsvector('english', remark));
create index idx_system_connections_remark_fts on system_connections using gin(to_tsvector('english', remark));
create index idx_management_ports_remark_fts on management_ports using gin(to_tsvector('english', remark));