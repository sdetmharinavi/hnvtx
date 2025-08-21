-- SDH Node Associations
create table sdh_node_associations (
  id UUID primary key default gen_random_uuid(),
  sdh_system_id UUID references sdh_systems (system_id) not null,
  node_id UUID references nodes (id) not null,
  node_position CHAR(1) check (node_position in ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H')),
  node_ip INET,
  constraint uq_sdh_system_position unique (sdh_system_id, node_position)
);