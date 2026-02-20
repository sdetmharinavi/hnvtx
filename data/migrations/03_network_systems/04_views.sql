-- path: data/migrations/03_network_systems/04_views.sql
-- Description: Defines denormalized views for the Network Systems module. [PERFORMANCE OPTIMIZED]

-- View for a complete picture of a system and its specific details.
CREATE OR REPLACE VIEW public.v_systems_complete WITH (security_invoker = true) AS
SELECT
  s.id,
  s.system_type_id,
  s.maan_node_id,
  s.node_id,
  s.system_name,
  s.is_hub,
  s.system_capacity_id,
  -- THE FIX: Cast the ip_address from INET to TEXT directly in the view definition.
  s.ip_address::text,
  s.maintenance_terminal_id,
  s.commissioned_on,
  s.s_no,
  s.asset_no, -- Added asset_no
  s.make,
  s.remark,
  s.status,
  s.created_at,
  s.updated_at,
  n.name AS node_name,
  lt_node_type.name AS node_type_name,
  lt_system.is_ring_based,
  n.latitude,
  n.longitude,
  lt_system.name AS system_type_name,
  lt_system.code AS system_type_code,
  lt_system.category AS system_category,
  lt_capacity.name AS system_capacity_name,
  ma.name AS system_maintenance_terminal_name,
  -- Aggregated ring information
  r_agg.ring_associations,
  (r_agg.ring_associations->0->>'ring_id')::UUID AS ring_id,
  (r_agg.ring_associations->0->>'order_in_ring')::NUMERIC AS order_in_ring,
  (r_agg.ring_associations->0->>'ring_logical_area_name')::TEXT AS ring_logical_area_name
FROM public.systems s
  JOIN public.nodes n ON s.node_id = n.id
  JOIN public.lookup_types lt_system ON s.system_type_id = lt_system.id
  LEFT JOIN public.lookup_types lt_capacity ON s.system_capacity_id = lt_capacity.id
  LEFT JOIN public.lookup_types lt_node_type ON n.node_type_id = lt_node_type.id
  LEFT JOIN public.maintenance_areas ma ON s.maintenance_terminal_id = ma.id
  LEFT JOIN LATERAL (
     SELECT
        jsonb_agg(
            jsonb_build_object(
                'ring_id', r.id,
                'ring_name', r.name,
                'order_in_ring', rbs.order_in_ring,
                'ring_logical_area_name', ra.name
            ) ORDER BY rbs.order_in_ring
        ) AS ring_associations
     FROM public.ring_based_systems rbs
     JOIN public.rings r ON rbs.ring_id = r.id
     LEFT JOIN public.maintenance_areas ra ON rbs.maintenance_area_id = ra.id
     WHERE rbs.system_id = s.id
  ) r_agg ON true;


-- 2. View for Services (Logical Entity)
CREATE OR REPLACE VIEW public.v_services WITH (security_invoker = true) AS
SELECT
    s.id,
    s.name,
    s.node_id,
    n.name AS node_name,
    s.end_node_id,
    n2.name AS end_node_name,
    ma.name AS maintenance_area_name,
    s.link_type_id,
    lt.name AS link_type_name,
    s.description,
    s.bandwidth_allocated,
    s.vlan,
    s.lc_id,
    s.unique_id,
    s.status,
    s.created_at,
    s.updated_at,
    -- Aggregated list of systems serving this service
    COALESCE(
      (
        SELECT jsonb_agg(DISTINCT jsonb_build_object(
            'id', sys.id, 
            'name', sys.system_name, 
            'ip_address', sys.ip_address::text,
            'interface', sc.system_working_interface
        ))
        FROM public.system_connections sc
        JOIN public.systems sys ON sc.system_id = sys.id
        WHERE sc.service_id = s.id
      ),
      '[]'::jsonb
    ) AS allocated_systems
FROM public.services s
LEFT JOIN public.nodes n ON s.node_id = n.id
LEFT JOIN public.nodes n2 ON s.end_node_id = n2.id
LEFT JOIN public.maintenance_areas ma ON n.maintenance_terminal_id = ma.id
LEFT JOIN public.lookup_types lt ON s.link_type_id = lt.id;

-- Grant permissions
GRANT SELECT ON public.v_services TO admin, admin_pro, viewer, cpan_admin, sdh_admin, asset_admin, mng_admin, authenticated;


-- View for a complete picture of a system connection and its specific details.
CREATE OR REPLACE VIEW public.v_system_connections_complete WITH (security_invoker = true) AS
SELECT
  sc.id,
  sc.system_id,
  s.system_name,
  lt_system.name AS system_type_name,
  
  -- Connection Specifics
  sc.services_ip,
  sc.services_interface,
  
  sc.sn_id,
  sc.en_id,
  na.id AS sn_node_id,
  nb.id AS en_node_id,
  sc.media_type_id,
  
  -- End A details
  s_sn.system_name AS sn_name, 
  na.name AS sn_node_name, 
  sc.sn_ip, 
  sc.sn_interface,
  
  -- End B details
  s_en.system_name AS en_name, 
  nb.name AS en_node_name, 
  sc.en_ip, 
  sc.en_interface,
  
  lt_media.name AS media_type_name,
  sc.bandwidth, 
  COALESCE(s_sn.system_name, s_en.system_name) AS connected_system_name,
  lt_sn_type.name AS sn_system_type_name,
  lt_en_type.name AS en_system_type_name,
  COALESCE(lt_sn_type.name, lt_en_type.name) AS connected_system_type_name, 
  
  sc.commissioned_on,
  sc.remark,
  sc.status,
  sc.created_at,
  sc.updated_at,
  
  -- SERVICE DATA (Logical)
  svc.id AS service_id,
  svc.name AS service_name, 
  svc.node_id AS service_node_id,
  svc_node.name AS service_node_name,
  svc.end_node_id AS service_end_node_id,
  svc_end_node.name AS service_end_node_name,
  
  svc.bandwidth_allocated,
  svc.vlan,
  svc.lc_id,
  svc.unique_id,
  svc.link_type_id AS connected_link_type_id,
  lt_link_type.name as connected_link_type_name,
  
  -- Fiber Arrays
  sc.working_fiber_in_ids,
  sc.working_fiber_out_ids,
  sc.protection_fiber_in_ids,
  sc.protection_fiber_out_ids,
  
  -- Interfaces
  sc.system_working_interface,
  sc.system_protection_interface,
  sc.en_protection_interface,
  
  -- SDH Details
  scs.stm_no AS sdh_stm_no, 
  scs.carrier AS sdh_carrier, 
  scs.a_slot AS sdh_a_slot,
  scs.a_customer AS sdh_a_customer, 
  scs.b_slot AS sdh_b_slot, 
  scs.b_customer AS sdh_b_customer

FROM public.system_connections sc
  JOIN public.systems s ON sc.system_id = s.id
  JOIN public.lookup_types lt_system ON s.system_type_id = lt_system.id
  LEFT JOIN public.services svc ON sc.service_id = svc.id
  LEFT JOIN public.nodes svc_node ON svc.node_id = svc_node.id
  LEFT JOIN public.nodes svc_end_node ON svc.end_node_id = svc_end_node.id
  
  LEFT JOIN public.lookup_types lt_link_type ON svc.link_type_id = lt_link_type.id
  LEFT JOIN public.systems s_sn ON sc.sn_id = s_sn.id
  LEFT JOIN public.nodes na ON s_sn.node_id = na.id
  LEFT JOIN public.systems s_en ON sc.en_id = s_en.id
  LEFT JOIN public.nodes nb ON s_en.node_id = nb.id
  LEFT JOIN public.lookup_types lt_sn_type ON s_sn.system_type_id = lt_sn_type.id
  LEFT JOIN public.lookup_types lt_en_type ON s_en.system_type_id = lt_en_type.id
  LEFT JOIN public.lookup_types lt_media ON sc.media_type_id = lt_media.id
  LEFT JOIN public.sdh_connections scs ON sc.id = scs.system_connection_id;

-- Grant permissions to new view
GRANT SELECT ON public.v_system_connections_complete TO admin, admin_pro, viewer, cpan_admin, sdh_admin, asset_admin, mng_admin, authenticated;

-- --- View for ports_management ---
CREATE OR REPLACE VIEW public.v_ports_management_complete WITH (security_invoker = true) AS
SELECT
  pm.id,
  pm.system_id,
  s.system_name,
  pm.port,
  pm.port_type_id,
  lt.name as port_type_name,
  lt.code as port_type_code,
  pm.port_capacity,
  pm.sfp_serial_no,
  pm.port_utilization,
  pm.port_admin_status,
  pm.services_count,
  pm.created_at,
  pm.updated_at
FROM public.ports_management pm
JOIN public.systems s ON pm.system_id = s.id
LEFT JOIN public.lookup_types lt ON pm.port_type_id = lt.id;

-- 3. Attach the auto-update trigger for updated_at
DROP TRIGGER IF EXISTS trigger_ports_management_updated_at ON public.ports_management;
CREATE TRIGGER trigger_ports_management_updated_at
BEFORE UPDATE ON public.ports_management
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- View for Ring Map Node Data
CREATE OR REPLACE VIEW public.v_ring_nodes WITH (security_invoker = true) AS
SELECT
    s.id as id,
    n.id as node_id,
    r.id as ring_id,
    r.name as ring_name,
    n.name,
    n.latitude as lat,
    n.longitude as long,
    s.is_hub,
    rbs.order_in_ring as order_in_ring,
    lt_node.name as type, 
    lt_system.name as system_type, 
    lt_system.code AS system_type_code,
    r.status AS ring_status,
    s.status AS system_status,
    s.system_name AS system_node_name,
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
    public.lookup_types lt_node ON n.node_type_id = lt_node.id
LEFT JOIN 
    public.lookup_types lt_system ON s.system_type_id = lt_system.id;

-- View for rings with joined data
CREATE OR REPLACE VIEW public.v_rings WITH (security_invoker = true) AS
SELECT
  r.id,
  r.name,
  r.description,
  r.ring_type_id,
  r.maintenance_terminal_id,
  r.is_closed_loop,
  r.topology_config,
  r.status,
  r.created_at,
  r.updated_at,
  r.ofc_status,
  r.spec_status,
  r.bts_status,
  (SELECT COUNT(s.node_id) FROM public.ring_based_systems rbs JOIN public.systems s ON rbs.system_id = s.id WHERE rbs.ring_id = r.id) as total_nodes,
  lt_ring.name AS ring_type_name,
  lt_ring.code AS ring_type_code,
  ma.name AS maintenance_area_name,
  -- NEW COLUMN: Aggregated system names for search
  (
    SELECT string_agg(s.system_name, ', ')
    FROM public.ring_based_systems rbs
    JOIN public.systems s ON rbs.system_id = s.id
    WHERE rbs.ring_id = r.id
  ) as associated_system_names
FROM public.rings r
LEFT JOIN public.lookup_types lt_ring ON r.ring_type_id = lt_ring.id
LEFT JOIN public.maintenance_areas ma ON r.maintenance_terminal_id = ma.id;
