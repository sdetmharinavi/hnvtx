-- Path: migrations/04_advanced_ofc/02_views.sql
-- Description: Defines views for analyzing OFC paths and utilization.

-- View showing complete information for a junction closure.
CREATE OR REPLACE VIEW public.v_junction_closures_complete WITH (security_invoker = true) AS
SELECT
  jc.id,
  jc.node_id,
  jc.ofc_cable_id,
  jc.position_km,
  n.name,
  n.latitude,
  n.longitude
FROM public.junction_closures jc
JOIN public.nodes n ON jc.node_id = n.id;


-- View showing end-to-end logical path summaries.
CREATE OR REPLACE VIEW public.v_end_to_end_paths WITH (security_invoker = true) AS
SELECT
  lfp.id AS path_id,
  lfp.path_name,
  lfp.source_system_id,
  lfp.destination_system_id,
  lfp.total_distance_km,
  lfp.total_loss_db,
  lt_status.name AS operational_status,
  COUNT(lps.id) AS segment_count,
  STRING_AGG(DISTINCT oc.route_name, ' -> ' ORDER BY oc.route_name) AS route_names
FROM public.logical_fiber_paths lfp
LEFT JOIN public.lookup_types lt_status ON lfp.operational_status_id = lt_status.id
LEFT JOIN public.logical_path_segments lps ON lfp.id = lps.logical_path_id
LEFT JOIN public.ofc_cables oc ON lps.ofc_cable_id = oc.id
GROUP BY
  lfp.id,
  lt_status.name;


-- View showing detailed segments for a given logical path.
CREATE OR REPLACE VIEW public.v_system_ring_paths_detailed WITH (security_invoker = true) AS
SELECT
  srp.id,
  srp.logical_path_id,
  lp.path_name,
  lp.source_system_id,
  srp.ofc_cable_id,
  srp.path_order,
  oc.route_name,
  oc.sn_id AS start_node_id,
  sn.name AS start_node_name,
  oc.en_id AS end_node_id,
  en.name AS end_node_name,
  srp.created_at
FROM public.logical_path_segments srp
JOIN public.logical_fiber_paths lp ON srp.logical_path_id = lp.id
JOIN public.ofc_cables oc ON srp.ofc_cable_id = oc.id
LEFT JOIN public.nodes sn ON oc.sn_id = sn.id
LEFT JOIN public.nodes en ON oc.en_id = en.id
ORDER BY
  srp.logical_path_id,
  srp.path_order;


-- View for calculating fiber utilization per cable.
CREATE OR REPLACE VIEW public.v_cable_utilization WITH (security_invoker = true) AS
SELECT
  oc.id AS cable_id,
  oc.route_name,
  oc.capacity,
  COUNT(lfp.id) FILTER (WHERE lt_status.name = 'active' AND conn.fiber_role = 'working') AS used_fibers,
  (oc.capacity - COUNT(conn.id)) AS available_fibers,
  ROUND(
    (COUNT(lfp.id) FILTER (WHERE lt_status.name = 'active' AND conn.fiber_role = 'working')::DECIMAL / NULLIF(oc.capacity, 0)) * 100, 2
  ) AS utilization_percent
FROM public.ofc_cables oc
LEFT JOIN public.ofc_connections conn ON oc.id = conn.ofc_id
LEFT JOIN public.logical_fiber_paths lfp ON conn.logical_path_id = lfp.id
LEFT JOIN public.lookup_types lt_status ON lfp.operational_status_id = lt_status.id
GROUP BY
  oc.id, oc.route_name, oc.capacity;