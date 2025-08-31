-- View for cable utilization
DROP VIEW IF EXISTS v_cable_utilization;
CREATE VIEW v_cable_utilization WITH (security_invoker = true) AS
SELECT 
  oc.id as cable_id,
  oc.route_name,
  oc.capacity,
  -- Count only fibers that are part of a working path and where the path's status is 'active'
  COUNT(lfp.id) FILTER (
    WHERE lt_status.name = 'active' AND conn.fiber_role = 'working'
  ) as used_fibers,
  
  -- Available fibers are total capacity minus all assigned fibers (both working and protection)
  (oc.capacity - COUNT(conn.id)) as available_fibers,
  
  -- Utilization is based on actively used "working" fibers
  ROUND(
    (COUNT(lfp.id) FILTER (WHERE lt_status.name = 'active' AND conn.fiber_role = 'working')::DECIMAL / NULLIF(oc.capacity, 0)) * 100, 2
  ) as utilization_percent
FROM 
  ofc_cables oc
  LEFT JOIN ofc_connections conn ON oc.id = conn.ofc_id
  LEFT JOIN logical_fiber_paths lfp ON conn.logical_path_id = lfp.id
  -- JOIN to lookup_types to get the status name
  LEFT JOIN lookup_types lt_status ON lfp.operational_status_id = lt_status.id
GROUP BY 
  oc.id, oc.route_name, oc.capacity;