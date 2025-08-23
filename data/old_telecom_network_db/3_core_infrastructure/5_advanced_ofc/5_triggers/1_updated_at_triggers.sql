-- Apply timestamp triggers to all tables
create trigger trigger_fiber_joints_updated_at before update on fiber_joints for each row execute function update_updated_at_column();
create trigger trigger_logical_fiber_paths_updated_at before update on logical_fiber_paths for each row execute function update_updated_at_column();
create trigger trigger_fiber_joint_connections_updated_at before update on fiber_joint_connections for each row execute function update_updated_at_column();