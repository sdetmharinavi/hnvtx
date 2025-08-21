-- View for end-to-end fiber paths
CREATE VIEW v_end_to_end_paths with (security_invoker = true) AS
SELECT 
  lfp.id as path_id,
  lfp.path_name,
  lfp.source_system_id,
  lfp.destination_system_id,
  lfp.total_distance_km,
  lfp.total_loss_db,
  lfp.operational_status,
  COUNT(oce.id) as segment_count,
  STRING_AGG(DISTINCT oc.route_name, ' -> ' ORDER BY oc.route_name) as route_names
FROM logical_fiber_paths lfp
LEFT JOIN ofc_connections oce ON lfp.id = oce.logical_path_id
LEFT JOIN ofc_cables oc ON oce.ofc_id = oc.id
GROUP BY lfp.id, lfp.path_name, lfp.source_system_id, lfp.destination_system_id, 
         lfp.total_distance_km, lfp.total_loss_db, lfp.operational_status;