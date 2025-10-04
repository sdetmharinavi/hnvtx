-- path: data/migrations/03_network_systems/02_views.sql
-- Description: Defines denormalized views for the Network Systems module. [PERFORMANCE OPTIMIZED]

-- View for a complete picture of a system and its specific details.
CREATE OR REPLACE VIEW public.v_systems_complete WITH (security_invoker = true) AS
SELECT
  s.*,
  n.name AS node_name,
  lt_node_type.name AS node_type_name,
  n.latitude,
  n.longitude,
  lt_system.name AS system_type_name,
  lt_system.code AS system_type_code,
  lt_system.category AS system_category,
  ma.name AS system_maintenance_terminal_name,
  rbs.ring_id,
  ring_area.name AS ring_logical_area_name,
  ss.gne AS sdh_gne,
  vs.vm_id AS vmux_vm_id
FROM public.systems s
  JOIN public.nodes n ON s.node_id = n.id
  JOIN public.lookup_types lt_system ON s.system_type_id = lt_system.id
  LEFT JOIN public.lookup_types lt_node_type ON n.node_type_id = lt_node_type.id
  LEFT JOIN public.maintenance_areas ma ON s.maintenance_terminal_id = ma.id
  LEFT JOIN public.ring_based_systems rbs ON s.id = rbs.system_id
  LEFT JOIN public.maintenance_areas ring_area ON rbs.maintenance_area_id = ring_area.id
  LEFT JOIN public.sdh_systems ss ON s.id = ss.system_id
  LEFT JOIN public.vmux_systems vs ON s.id = vs.system_id;


-- View for a complete picture of a system connection and its specific details.
CREATE OR REPLACE VIEW public.v_system_connections_complete WITH (security_invoker = true) AS
SELECT
  sc.id, sc.system_id, s.system_name, lt_system.name AS system_type_name,
  s_sn.system_name AS sn_name, na.name AS sn_node_name, sc.sn_ip, sc.sn_interface,
  s_en.system_name AS en_name, nb.name AS en_node_name, sc.en_ip, sc.en_interface,
  lt_media.name AS media_type_name, sc.bandwidth_mbps, cs.system_name AS connected_system_name,
  lt_cs_type.name AS connected_system_type_name, sc.vlan, sc.commissioned_on,
  sc.remark, sc.status, sc.created_at, sc.updated_at,
  -- SFP-based details
  sfpc.sfp_port, lt_sfp.name as sfp_type_name, sfpc.sfp_capacity,
  sfpc.sfp_serial_no, sfpc.fiber_in, sfpc.fiber_out, sfpc.customer_name, sfpc.bandwidth_allocated_mbps,
  -- SDH details
  scs.stm_no AS sdh_stm_no, scs.carrier AS sdh_carrier, scs.a_slot AS sdh_a_slot,
  scs.a_customer AS sdh_a_customer, scs.b_slot AS sdh_b_slot, scs.b_customer AS sdh_b_customer,
  -- VMUX details
  vcs.subscriber AS vmux_subscriber, vcs.c_code AS vmux_c_code, vcs.channel AS vmux_channel, vcs.tk AS vmux_tk
FROM public.system_connections sc
  JOIN public.systems s ON sc.system_id = s.id
  JOIN public.lookup_types lt_system ON s.system_type_id = lt_system.id
  LEFT JOIN public.systems s_sn ON sc.sn_id = s_sn.id
  LEFT JOIN public.nodes na ON s_sn.node_id = na.id
  LEFT JOIN public.systems s_en ON sc.en_id = s_en.id
  LEFT JOIN public.nodes nb ON s_en.node_id = nb.id
  LEFT JOIN public.systems cs ON sc.connected_system_id = cs.id
  LEFT JOIN public.lookup_types lt_cs_type ON cs.system_type_id = lt_cs_type.id
  LEFT JOIN public.lookup_types lt_media ON sc.media_type_id = lt_media.id
  LEFT JOIN public.sfp_based_connections sfpc ON sc.id = sfpc.system_connection_id
  LEFT JOIN public.lookup_types lt_sfp ON sfpc.sfp_type_id = lt_sfp.id
  LEFT JOIN public.sdh_connections scs ON sc.id = scs.system_connection_id
  LEFT JOIN public.vmux_connections vcs ON sc.id = vcs.system_connection_id;


-- View for OFC Connections, now including system details from this module.
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
  s.system_name AS system_name,
  nb.name AS en_name
FROM public.ofc_connections oc
  JOIN public.ofc_cables ofc ON oc.ofc_id = ofc.id
  JOIN public.lookup_types ofc_type ON ofc.ofc_type_id = ofc_type.id
  LEFT JOIN public.nodes na ON ofc.sn_id = na.id
  LEFT JOIN public.nodes nb ON ofc.en_id = nb.id
  LEFT JOIN public.systems s ON oc.system_id = s.id
  LEFT JOIN public.maintenance_areas ma ON ofc.maintenance_terminal_id = ma.id;


-- View for Ring Map Node Data
CREATE OR REPLACE VIEW public.v_ring_nodes WITH (security_invoker = true) AS
SELECT
    n.id,
    r.id as ring_id,
    r.name as ring_name,
    n.name,
    n.latitude as lat,
    n.longitude as long,
    ROW_NUMBER() OVER(PARTITION BY r.id ORDER BY n.name) as order_in_ring,
    lt.name as type,
    -- [THE FIX] Expose both the ring's status and the system's status for accurate representation.
    r.status AS ring_status,
    s.status AS system_status,
    s.ip_address::text as ip,
    n.remark
FROM
    public.rings r
JOIN
    public.ring_based_systems rbs ON r.id = rbs.ring_id
JOIN
    public.systems s ON rbs.system_id = s.id
JOIN
    public.nodes n ON s.node_id = n.id
LEFT JOIN
    public.lookup_types lt ON n.node_type_id = lt.id;

-- View for rings with joined data
CREATE OR REPLACE VIEW public.v_rings WITH (security_invoker = true) AS
SELECT
  r.id,
  r.name,
  r.description,
  r.ring_type_id,
  r.maintenance_terminal_id,
  r.status,
  r.created_at,
  r.updated_at,
  (SELECT COUNT(s.node_id) FROM public.ring_based_systems rbs JOIN public.systems s ON rbs.system_id = s.id WHERE rbs.ring_id = r.id) as total_nodes,
  lt_ring.name AS ring_type_name,
  lt_ring.code AS ring_type_code,
  ma.name AS maintenance_area_name
FROM public.rings r
LEFT JOIN public.lookup_types lt_ring ON r.ring_type_id = lt_ring.id
LEFT JOIN public.maintenance_areas ma ON r.maintenance_terminal_id = ma.id;