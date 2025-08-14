-- Composite indexes for common queries
create index idx_nodes_ring_order on nodes (ring_id, order_in_ring) where ring_id is not null;
create index idx_systems_node_type on systems (node_id, system_type_id);