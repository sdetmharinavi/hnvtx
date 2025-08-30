-- This view depends on tables now created in this module, so it belongs here.
DROP VIEW IF EXISTS public.v_system_ring_paths_detailed;

CREATE VIEW public.v_system_ring_paths_detailed WITH (security_invoker = true) AS
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
FROM
  public.logical_path_segments srp
  JOIN public.logical_fiber_paths lp ON srp.logical_path_id = lp.id
  JOIN public.ofc_cables oc ON srp.ofc_cable_id = oc.id
  LEFT JOIN public.nodes sn ON oc.sn_id = sn.id
  LEFT JOIN public.nodes en ON oc.en_id = en.id
ORDER BY
  srp.logical_path_id,
  srp.path_order;