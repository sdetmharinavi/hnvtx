-- Complete Node Information View (SECURITY INVOKER)
create view v_rings_with_count with (security_invoker = true) as
select r.*,
  lt_ring.name as ring_type_name,
  lt_ring.code as ring_type_code,
  lt_ring.category as ring_type_category,
  lt_ring.sort_order as ring_type_sort_order,
  lt_ring.is_system_default as ring_type_is_system_default,
  lt_ring.status as ring_type_status,
  lt_ring.created_at as ring_type_created_at,
  lt_ring.updated_at as ring_type_updated_at,
  ma.name as maintenance_area_name,
  ma.code as maintenance_area_code,
  ma.email as maintenance_area_email,
  ma.contact_person as maintenance_area_contact_person,
  ma.contact_number as maintenance_area_contact_number,
  ma.latitude as maintenance_area_latitude,
  ma.longitude as maintenance_area_longitude,
  ma.area_type_id as maintenance_area_area_type_id,
  ma.parent_id as maintenance_area_parent_id,
  ma.status as maintenance_area_status,
  ma.created_at as maintenance_area_created_at,
  ma.updated_at as maintenance_area_updated_at,
  count(*) OVER() AS total_count,
  sum(CASE WHEN r.status = true THEN 1 ELSE 0 END) OVER() AS active_count,
  sum(CASE WHEN r.status = false THEN 1 ELSE 0 END) OVER() AS inactive_count
FROM rings r
  LEFT JOIN lookup_types lt_ring ON r.ring_type_id = lt_ring.id
  LEFT JOIN maintenance_areas ma ON r.maintenance_terminal_id = ma.id;
