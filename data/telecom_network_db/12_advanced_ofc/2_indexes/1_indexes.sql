-- 6. Indexes for performance
CREATE INDEX idx_ofc_connections_enhanced_ofc_id ON ofc_connections_enhanced(ofc_id);
CREATE INDEX idx_ofc_connections_enhanced_logical_path ON ofc_connections_enhanced(logical_path_id);
CREATE INDEX idx_ofc_connections_enhanced_source ON ofc_connections_enhanced(source_type, source_id);
CREATE INDEX idx_ofc_connections_enhanced_destination ON ofc_connections_enhanced(destination_type, destination_id);
CREATE INDEX idx_fiber_joint_connections_joint_id ON fiber_joint_connections(joint_id);
CREATE INDEX idx_fiber_joint_connections_logical_path ON fiber_joint_connections(logical_path_id);
CREATE INDEX idx_logical_fiber_paths_systems ON logical_fiber_paths(source_system_id, destination_system_id);

-- 7. Views for easier querying