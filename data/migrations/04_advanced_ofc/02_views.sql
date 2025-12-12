-- Path: migrations/04_advanced_ofc/02_views.sql
-- Description: Defines views for analyzing OFC paths and utilization. [UPDATED]

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

-- NEW VIEW: This view helps find which cable segments are connected to a specific JC node.
CREATE OR REPLACE VIEW public.v_cable_segments_at_jc WITH (security_invoker = true) AS
SELECT
  cs.id,
  cs.original_cable_id,
  cs.segment_order,
  cs.fiber_count,
  cs.start_node_id,
  cs.end_node_id,
  jcs.node_id as jc_node_id
FROM public.cable_segments cs
JOIN public.junction_closures jcs ON (cs.start_node_type = 'jc' AND cs.start_node_id = jcs.node_id)
                                  OR (cs.end_node_type = 'jc' AND cs.end_node_id = jcs.node_id);


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

-- View for calculating fiber utilization per cable.
CREATE OR REPLACE VIEW public.v_cable_utilization WITH (security_invoker = true) AS
SELECT
  oc.id AS cable_id,
  oc.route_name,
  oc.capacity,
  -- [THE FIX] A fiber is used if it's assigned to ANY logical path. Role doesn't matter.
  COUNT(conn.id) FILTER (WHERE conn.logical_path_id IS NOT NULL) AS used_fibers,
  -- This logic remains correct.
  COUNT(conn.id) FILTER (WHERE conn.logical_path_id IS NULL) AS available_fibers,
  -- [THE FIX] The percentage now correctly reflects all used fibers.
  ROUND(
    (COUNT(conn.id) FILTER (WHERE conn.logical_path_id IS NOT NULL)::DECIMAL / NULLIF(oc.capacity, 0)) * 100, 2
  ) AS utilization_percent
FROM public.ofc_cables oc
LEFT JOIN public.ofc_connections conn ON oc.id = conn.ofc_id
GROUP BY
  oc.id, oc.route_name, oc.capacity;