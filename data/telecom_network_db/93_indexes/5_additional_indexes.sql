-- =================================================================
-- Additional Indexes for Foreign Key Columns
-- =================================================================
-- This script adds indexes to foreign key columns that do not
-- already have an index, improving query performance for JOINs.
-- =================================================================

-- Indexes for Master Tables
CREATE INDEX idx_maintenance_areas_parent_id ON public.maintenance_areas (parent_id);
CREATE INDEX idx_employee_designations_parent_id ON public.employee_designations (parent_id);
CREATE INDEX idx_employees_employee_designation_id ON public.employees (employee_designation_id);
CREATE INDEX idx_employees_maintenance_terminal_id ON public.employees (maintenance_terminal_id);

-- Indexes for Core Infrastructure Tables
CREATE INDEX idx_rings_maintenance_terminal_id ON public.rings (maintenance_terminal_id);
CREATE INDEX idx_ofc_cables_sn_id ON public.ofc_cables (sn_id);
CREATE INDEX idx_ofc_cables_en_id ON public.ofc_cables (en_id);
CREATE INDEX idx_ofc_cables_maintenance_terminal_id ON public.ofc_cables (maintenance_terminal_id);
CREATE INDEX idx_management_ports_node_id ON public.management_ports (node_id);
CREATE INDEX idx_management_ports_system_id ON public.management_ports (system_id);

-- Indexes for System-Specific Connection Tables
CREATE INDEX idx_cpan_connections_sfp_type_id ON public.cpan_connections (sfp_type_id);
CREATE INDEX idx_maan_connections_sfp_type_id ON public.maan_connections (sfp_type_id);

-- Indexes for SDH Node Associations
CREATE INDEX idx_sdh_node_associations_sdh_system_id ON public.sdh_node_associations (sdh_system_id);
CREATE INDEX idx_sdh_node_associations_node_id ON public.sdh_node_associations (node_id);

-- Indexes for Advanced OFC Module Tables
CREATE INDEX idx_fiber_joints_node_id ON public.fiber_joints (node_id);
CREATE INDEX idx_fiber_joints_maintenance_area_id ON public.fiber_joints (maintenance_area_id);
CREATE INDEX idx_logical_fiber_paths_source_system_id ON public.logical_fiber_paths (source_system_id);
CREATE INDEX idx_logical_fiber_paths_destination_system_id ON public.logical_fiber_paths (destination_system_id);
CREATE INDEX idx_fiber_joint_connections_joint_id ON public.fiber_joint_connections (joint_id);
CREATE INDEX idx_fiber_joint_connections_input_ofc_id ON public.fiber_joint_connections (input_ofc_id);
CREATE INDEX idx_fiber_joint_connections_output_ofc_id ON public.fiber_joint_connections (output_ofc_id);
CREATE INDEX idx_fiber_joint_connections_logical_path_id ON public.fiber_joint_connections (logical_path_id);

