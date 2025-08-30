-- ADDED: Indexes for new advanced tables
CREATE INDEX idx_fiber_joints_node_id ON public.fiber_joints (node_id);
CREATE INDEX idx_logical_fiber_paths_source_system_id ON public.logical_fiber_paths (source_system_id);
CREATE INDEX idx_logical_path_segments_path_id ON public.logical_path_segments(logical_path_id);