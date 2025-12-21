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

-- =================================================================
-- This view is placed here because it depends on tables from modules 02, 03, and 04.
-- =================================================================
CREATE OR REPLACE VIEW public.v_ofc_connections_complete WITH (security_invoker = true) AS
SELECT
  oc.id::uuid,
  oc.ofc_id::uuid,
  oc.fiber_no_sn::integer,
  oc.fiber_no_en::integer,
  oc.updated_fiber_no_sn::integer,
  oc.updated_fiber_no_en::integer,
  oc.updated_sn_id::uuid,
  oc.updated_en_id::uuid,
  oc.otdr_distance_sn_km::numeric(10,3),
  oc.sn_dom::date,
  oc.sn_power_dbm::numeric(10,3),
  oc.system_id::uuid,
  oc.otdr_distance_en_km::numeric(10,3),
  oc.en_dom::date,
  oc.en_power_dbm::numeric(10,3),
  oc.route_loss_db::numeric(10,3),
  oc.logical_path_id::uuid,
  oc.fiber_role::text,
  oc.path_segment_order::integer,
  oc.path_direction::text,
  oc.source_port::text,
  oc.destination_port::text,
  oc.connection_category::text,
  oc.connection_type::text,
  oc.remark::text,
  oc.status::boolean,
  oc.created_at::timestamptz,
  oc.updated_at::timestamptz,
  ofc.route_name AS ofc_route_name,
  ma.name AS maintenance_area_name,
  ofc.sn_id::uuid,
  ofc.en_id::uuid,
  ofc_type.name AS ofc_type_name,
  na.name AS sn_name,
  nb.name AS en_name,
  updated_na.name AS updated_sn_name,
  updated_nb.name AS updated_en_name,
  
  -- UPDATED SYSTEM NAME LOGIC: System / Interface / Service
  CONCAT_WS(' / ', 
    s.system_name, 
    CASE 
      WHEN oc.fiber_role = 'protection' THEN sc.system_protection_interface 
      ELSE sc.system_working_interface 
    END, 
    svc.name
  ) AS system_name

FROM public.ofc_connections oc
  JOIN public.ofc_cables ofc ON oc.ofc_id = ofc.id
  JOIN public.lookup_types ofc_type ON ofc.ofc_type_id = ofc_type.id
  LEFT JOIN public.nodes na ON ofc.sn_id = na.id
  LEFT JOIN public.nodes nb ON ofc.en_id = nb.id
  LEFT JOIN public.systems s ON oc.system_id = s.id
  LEFT JOIN public.maintenance_areas ma ON ofc.maintenance_terminal_id = ma.id
  LEFT JOIN public.nodes updated_na ON oc.updated_sn_id = updated_na.id
  LEFT JOIN public.nodes updated_nb ON oc.updated_en_id = updated_nb.id
  -- New Joins for Context
  LEFT JOIN public.logical_fiber_paths lfp ON oc.logical_path_id = lfp.id
  LEFT JOIN public.system_connections sc ON lfp.system_connection_id = sc.id
  LEFT JOIN public.services svc ON sc.service_id = svc.id;