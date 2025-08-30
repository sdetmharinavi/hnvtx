-- Core Infrastructure and Master Table Indexes

-- Indexes for nodes
create index idx_nodes_type_id on nodes (node_type_id);
create index idx_nodes_maintenance_area on nodes (maintenance_terminal_id);
create index idx_nodes_coordinates on nodes (latitude, longitude);
create index idx_nodes_status on nodes (status);

-- Indexes for ofc_connections
create index idx_ofc_connections_ofc_id on ofc_connections (ofc_id);
create index idx_ofc_connections_system_id on ofc_connections (system_id);
create index idx_ofc_connections_logical_path_id on ofc_connections (logical_path_id);

-- Indexes from master tables
create index idx_maintenance_areas_parent_id ON public.maintenance_areas (parent_id);
create index idx_employee_designations_parent_id ON public.employee_designations (parent_id);
create index idx_employees_employee_designation_id ON public.employees (employee_designation_id);
create index idx_employees_maintenance_terminal_id ON public.employees (maintenance_terminal_id);


