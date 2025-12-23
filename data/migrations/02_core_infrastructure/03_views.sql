-- path: data/migrations/02_core_infrastructure/03_views.sql
-- Description: Defines denormalized views for the Core Infrastructure module. [PERFORMANCE OPTIMIZED]

-- View for lookup_types
CREATE OR REPLACE VIEW public.v_lookup_types WITH (security_invoker = true) AS
SELECT
  lt.*
FROM public.lookup_types lt;

-- View for maintenance_areas with joined data
CREATE OR REPLACE VIEW public.v_maintenance_areas WITH (security_invoker = true) AS
SELECT
  ma.*,
  lt_ma.name AS maintenance_area_type_name,
  lt_ma.code AS maintenance_area_type_code
FROM public.maintenance_areas ma
LEFT JOIN public.lookup_types lt_ma ON ma.area_type_id = lt_ma.id;

-- View for employee_designations
CREATE OR REPLACE VIEW public.v_employee_designations WITH (security_invoker = true) AS
SELECT
  ed.*
FROM public.employee_designations ed;

-- View for employees with joined data
CREATE OR REPLACE VIEW public.v_employees WITH (security_invoker = true) AS
SELECT
  e.*,
  ed.name AS employee_designation_name,
  ma.name AS maintenance_area_name
FROM public.employees e
LEFT JOIN public.employee_designations ed ON e.employee_designation_id = ed.id
LEFT JOIN public.maintenance_areas ma ON e.maintenance_terminal_id = ma.id;

-- View for nodes with joined data
CREATE OR REPLACE VIEW public.v_nodes_complete WITH (security_invoker = true) AS
SELECT
  n.*,
  lt_node.name AS node_type_name,
  lt_node.code AS node_type_code,
  ma.name AS maintenance_area_name
FROM public.nodes n
LEFT JOIN public.lookup_types lt_node ON n.node_type_id = lt_node.id
LEFT JOIN public.maintenance_areas ma ON n.maintenance_terminal_id = ma.id;

-- View for ofc_cables with joined data
CREATE OR REPLACE VIEW public.v_ofc_cables_complete WITH (security_invoker = true) AS
SELECT
  ofc.id,
  ofc.route_name,
  ofc.sn_id,
  ofc.en_id,
  ofc.ofc_type_id,
  ofc.capacity,
  ofc.ofc_owner_id,
  ofc.current_rkm,
  ofc.transnet_id,
  ofc.transnet_rkm,
  ofc.asset_no,
  ofc.maintenance_terminal_id,
  ofc.commissioned_on,
  ofc.remark,
  ofc.status,
  ofc.created_at,
  ofc.updated_at,
  
  -- Joined Names
  sn.name AS sn_name,
  en.name AS en_name,
  
  -- Joined Types
  lt_sn_type.name as sn_node_type_name,
  lt_en_type.name as en_node_type_name,
  
  -- Joined OFC Metadata
  lt_ofc.name AS ofc_type_name,
  lt_ofc.code AS ofc_type_code,
  
  lt_ofc_owner.name AS ofc_owner_name,
  lt_ofc_owner.code AS ofc_owner_code,
  
  -- Joined Area
  ma.name AS maintenance_area_name,
  ma.code AS maintenance_area_code

FROM public.ofc_cables ofc
LEFT JOIN public.nodes sn ON ofc.sn_id = sn.id
LEFT JOIN public.nodes en ON ofc.en_id = en.id
LEFT JOIN public.lookup_types lt_ofc ON ofc.ofc_type_id = lt_ofc.id
LEFT JOIN public.lookup_types lt_ofc_owner ON ofc.ofc_owner_id = lt_ofc_owner.id
LEFT JOIN public.maintenance_areas ma ON ofc.maintenance_terminal_id = ma.id
LEFT JOIN public.lookup_types lt_sn_type ON sn.node_type_id = lt_sn_type.id
LEFT JOIN public.lookup_types lt_en_type ON en.node_type_id = lt_en_type.id;

-- Grant Permissions
GRANT SELECT ON public.v_ofc_cables_complete TO authenticated;

