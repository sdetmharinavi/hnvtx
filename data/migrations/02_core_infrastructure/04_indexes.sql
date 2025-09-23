-- Path: migrations/02_core_infrastructure/04_indexes.sql
-- Description: Creates all B-tree and GIN (FTS) indexes for the Core module.

-- =================================================================
-- Section 1: Standard B-Tree Indexes
-- =================================================================

-- Indexes for lookup_types
CREATE INDEX IF NOT EXISTS idx_lookup_types_category ON public.lookup_types (category);
CREATE INDEX IF NOT EXISTS idx_lookup_types_name ON public.lookup_types (name);

-- Indexes for maintenance_areas
CREATE INDEX IF NOT EXISTS idx_maintenance_areas_parent_id ON public.maintenance_areas (parent_id);

-- Indexes for employee_designations
CREATE INDEX IF NOT EXISTS idx_employee_designations_parent_id ON public.employee_designations (parent_id);

-- Indexes for employees
CREATE INDEX IF NOT EXISTS idx_employees_employee_designation_id ON public.employees (employee_designation_id);
CREATE INDEX IF NOT EXISTS idx_employees_maintenance_terminal_id ON public.employees (maintenance_terminal_id);

-- Indexes for nodes
CREATE INDEX IF NOT EXISTS idx_nodes_type_id ON public.nodes (node_type_id);
CREATE INDEX IF NOT EXISTS idx_nodes_maintenance_area ON public.nodes (maintenance_terminal_id);
CREATE INDEX IF NOT EXISTS idx_nodes_coordinates ON public.nodes (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_nodes_status ON public.nodes (status);

-- Indexes for ofc_connections
CREATE INDEX IF NOT EXISTS idx_ofc_connections_ofc_id ON public.ofc_connections (ofc_id);
CREATE INDEX IF NOT EXISTS idx_ofc_connections_system_id ON public.ofc_connections (system_id);
CREATE INDEX IF NOT EXISTS idx_ofc_connections_logical_path_id ON public.ofc_connections (logical_path_id);

-- Indexes for files/folders
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON public.folders USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_files_user_id ON public.files USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_files_folder_id ON public.files USING btree (folder_id);

-- =================================================================
-- Section 2: Full-Text Search (FTS) GIN Indexes
-- =================================================================

CREATE INDEX IF NOT EXISTS idx_employees_remark_fts ON public.employees USING gin(to_tsvector('english', remark));
CREATE INDEX IF NOT EXISTS idx_nodes_remark_fts ON public.nodes USING gin(to_tsvector('english', remark));
CREATE INDEX IF NOT EXISTS idx_ofc_cables_remark_fts ON public.ofc_cables USING gin(to_tsvector('english', remark));
CREATE INDEX IF NOT EXISTS idx_ofc_connections_remark_fts ON public.ofc_connections USING gin(to_tsvector('english', remark));