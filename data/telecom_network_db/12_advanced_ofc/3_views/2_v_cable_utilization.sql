-- View for cable utilization
CREATE VIEW v_cable_utilization with (security_invoker = true) AS
SELECT 
  oc.id as cable_id,
  oc.route_name,
  oc.capacity,
  COUNT(oce.id) as used_fibers,
  (oc.capacity - COUNT(oce.id)) as available_fibers,
  ROUND((COUNT(oce.id)::DECIMAL / oc.capacity) * 100, 2) as utilization_percent
FROM ofc_cables oc
LEFT JOIN ofc_connections oce ON oc.id = oce.ofc_id AND oce.status = true
GROUP BY oc.id, oc.route_name, oc.capacity;