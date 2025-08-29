CREATE INDEX idx_fiber_joints_joint_type ON public.fiber_joints (joint_category, joint_type);
CREATE INDEX idx_logical_fiber_paths_operational_status ON public.logical_fiber_paths (operational_status_category, operational_status);
CREATE INDEX idx_logical_fiber_paths_fk_path_type ON public.logical_fiber_paths (path_category, path_type);
CREATE INDEX idx_ofc_connections_connection_type ON public.ofc_connections (connection_category, connection_type);