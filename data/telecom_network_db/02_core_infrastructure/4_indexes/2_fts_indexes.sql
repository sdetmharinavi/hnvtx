-- Add GIN indexes for full-text search on Core Infrastructure remark fields
create index idx_employees_remark_fts on employees using gin(to_tsvector('english', remark));
create index idx_nodes_remark_fts on nodes using gin(to_tsvector('english', remark));
create index idx_ofc_cables_remark_fts on ofc_cables using gin(to_tsvector('english', remark));
create index idx_ofc_connections_remark_fts on ofc_connections using gin(to_tsvector('english', remark));