-- REFACTORED: This view now correctly joins with lookup_types to get the
-- human-readable operational status name from the new operational_status_id field.

DROP VIEW IF EXISTS v_end_to_end_paths;
CREATE VIEW v_end_to_end_paths WITH (security_invoker = true) AS
SELECT 
  lfp.id as path_id,
  lfp.path_name,
  lfp.source_system_id,
  lfp.destination_system_id,
  lfp.total_distance_km,
  lfp.total_loss_db,
  
  -- CORRECTED: Join to lookup_types to get the status name
  lt_status.name as operational_status,
  
  COUNT(lps.id) as segment_count, -- Count from logical_path_segments for accuracy
  STRING_AGG(DISTINCT oc.route_name, ' -> ' ORDER BY oc.route_name) as route_names
FROM 
  logical_fiber_paths lfp
  -- Join to get the operational status name
  LEFT JOIN lookup_types lt_status ON lfp.operational_status_id = lt_status.id
  -- Join through the segment table to find the associated cables
  LEFT JOIN logical_path_segments lps ON lfp.id = lps.logical_path_id
  LEFT JOIN ofc_cables oc ON lps.ofc_cable_id = oc.id
GROUP BY 
  lfp.id, 
  lfp.path_name, 
  lfp.source_system_id, 
  lfp.destination_system_id, 
  lfp.total_distance_km, 
  lfp.total_loss_db, 
  lt_status.name; -- Group by the name from the joined table