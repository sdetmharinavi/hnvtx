-- ADDED: Triggers for new advanced tables
create trigger trigger_fiber_joints_updated_at before update on fiber_joints for each row execute function update_updated_at_column();
create trigger trigger_logical_fiber_paths_updated_at before update on logical_fiber_paths for each row execute function update_updated_at_column();
create trigger trigger_logical_path_segments_updated_at before update on logical_path_segments for each row execute function update_updated_at_column();