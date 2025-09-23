-- Path: migrations/02_core_infrastructure/03_views.sql
-- Description: Defines denormalized views for the Core Infrastructure module.

-- View for lookup_types with aggregate counts
CREATE OR REPLACE VIEW public.v_lookup_types_with_count WITH (security_barrier = true) AS
SELECT
  lt.*,
  count(*) OVER() AS total_count,
  sum(CASE WHEN lt.status = true THEN 1 ELSE 0 END) OVER() AS active_count,
  sum(CASE WHEN lt.status = false THEN 1 ELSE 0 END) OVER() AS inactive_count
FROM public.lookup_types lt;

-- View for maintenance_areas with joined data and aggregate counts
CREATE OR REPLACE VIEW public.v_maintenance_areas_with_count WITH (security_barrier = true) AS
SELECT
  ma.*,
  lt_ma.name AS maintenance_area_type_name,
  lt_ma.code AS maintenance_area_type_code,
  lt_ma.category AS maintenance_area_type_category,
  lt_ma.sort_order AS maintenance_area_type_sort_order,
  lt_ma.is_system_default AS maintenance_area_type_is_system_default,
  lt_ma.status AS maintenance_area_type_status,
  lt_ma.created_at AS maintenance_area_type_created_at,
  lt_ma.updated_at AS maintenance_area_type_updated_at,
  count(*) OVER() AS total_count,
  sum(CASE WHEN ma.status = true THEN 1 ELSE 0 END) OVER() AS active_count,
  sum(CASE WHEN ma.status = false THEN 1 ELSE 0 END) OVER() AS inactive_count
FROM public.maintenance_areas ma
LEFT JOIN public.lookup_types lt_ma ON ma.area_type_id = lt_ma.id;

-- View for employee_designations with aggregate counts
CREATE OR REPLACE VIEW public.v_employee_designations_with_count WITH (security_barrier = true) AS
SELECT
  ed.*,
  count(*) OVER() AS total_count,
  sum(CASE WHEN ed.status = true THEN 1 ELSE 0 END) OVER() AS active_count,
  sum(CASE WHEN ed.status = false THEN 1 ELSE 0 END) OVER() AS inactive_count
FROM public.employee_designations ed;

-- View for employees with joined data and aggregate counts
CREATE OR REPLACE VIEW public.v_employees_with_count WITH (security_barrier = true) AS
SELECT
  e.*,
  ed.name AS employee_designation_name,
  count(*) OVER() AS total_count,
  sum(CASE WHEN e.status = true THEN 1 ELSE 0 END) OVER() AS active_count,
  sum(CASE WHEN e.status = false THEN 1 ELSE 0 END) OVER() AS inactive_count
FROM public.employees e
LEFT JOIN public.employee_designations ed ON e.employee_designation_id = ed.id;

-- View for rings with joined data and aggregate counts
CREATE OR REPLACE VIEW public.v_rings_with_count WITH (security_barrier = true) AS
SELECT
  r.*,
  lt_ring.name AS ring_type_name,
  lt_ring.code AS ring_type_code,
  lt_ring.category AS ring_type_category,
  lt_ring.sort_order AS ring_type_sort_order,
  lt_ring.is_system_default AS ring_type_is_system_default,
  lt_ring.status AS ring_type_status,
  lt_ring.created_at AS ring_type_created_at,
  lt_ring.updated_at AS ring_type_updated_at,
  ma.name AS maintenance_area_name,
  ma.code AS maintenance_area_code,
  ma.email AS maintenance_area_email,
  ma.contact_person AS maintenance_area_contact_person,
  ma.contact_number AS maintenance_area_contact_number,
  ma.latitude AS maintenance_area_latitude,
  ma.longitude AS maintenance_area_longitude,
  ma.area_type_id AS maintenance_area_area_type_id,
  ma.parent_id AS maintenance_area_parent_id,
  ma.status AS maintenance_area_status,
  ma.created_at AS maintenance_area_created_at,
  ma.updated_at AS maintenance_area_updated_at,
  count(*) OVER() AS total_count,
  sum(CASE WHEN r.status = true THEN 1 ELSE 0 END) OVER() AS active_count,
  sum(CASE WHEN r.status = false THEN 1 ELSE 0 END) OVER() AS inactive_count
FROM public.rings r
LEFT JOIN public.lookup_types lt_ring ON r.ring_type_id = lt_ring.id
LEFT JOIN public.maintenance_areas ma ON r.maintenance_terminal_id = ma.id;

-- View for nodes with joined data and aggregate counts
CREATE OR REPLACE VIEW public.v_nodes_complete WITH (security_barrier = true) AS
SELECT
  n.*,
  lt_node.name AS node_type_name,
  lt_node.code AS node_type_code,
  ma.name AS maintenance_area_name,
  ma.code AS maintenance_area_code,
  lt_ma.name AS maintenance_area_type_name,
  count(*) OVER() AS total_count,
  sum(CASE WHEN n.status = true THEN 1 ELSE 0 END) OVER() AS active_count,
  sum(CASE WHEN n.status = false THEN 1 ELSE 0 END) OVER() AS inactive_count
FROM public.nodes n
LEFT JOIN public.lookup_types lt_node ON n.node_type_id = lt_node.id
LEFT JOIN public.maintenance_areas ma ON n.maintenance_terminal_id = ma.id
LEFT JOIN public.lookup_types lt_ma ON ma.area_type_id = lt_ma.id;

-- View for ofc_cables with joined data and aggregate counts
CREATE OR REPLACE VIEW public.v_ofc_cables_complete WITH (security_barrier = true) AS
SELECT
  ofc.id,
  ofc.route_name,
  ofc.sn_id,
  ofc.en_id,
  sn.name AS sn_name,
  en.name AS en_name,
  ofc.capacity,
  ofc.ofc_type_id,
  lt_ofc.name AS ofc_type_name,
  lt_ofc.code AS ofc_type_code,
  ofc.ofc_owner_id,
  lt_ofc_owner.name AS ofc_owner_name,
  lt_ofc_owner.code AS ofc_owner_code,
  ofc.asset_no,
  ofc.transnet_id,
  ofc.transnet_rkm,
  ofc.current_rkm,
  ofc.maintenance_terminal_id,
  ma.name AS maintenance_area_name,
  ma.code AS maintenance_area_code,
  ofc.commissioned_on,
  ofc.status,
  ofc.remark,
  ofc.created_at,
  ofc.updated_at,
  count(*) OVER() AS total_count,
  sum(CASE WHEN ofc.status = true THEN 1 ELSE 0 END) OVER() AS active_count,
  sum(CASE WHEN ofc.status = false THEN 1 ELSE 0 END) OVER() AS inactive_count
FROM public.ofc_cables ofc
LEFT JOIN public.nodes sn ON ofc.sn_id = sn.id
LEFT JOIN public.nodes en ON ofc.en_id = en.id
LEFT JOIN public.lookup_types lt_ofc ON ofc.ofc_type_id = lt_ofc.id
LEFT JOIN public.lookup_types lt_ofc_owner ON ofc.ofc_owner_id = lt_ofc_owner.id
LEFT JOIN public.maintenance_areas ma ON ofc.maintenance_terminal_id = ma.id;