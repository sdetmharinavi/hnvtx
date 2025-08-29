-- Complete Node Information View (SECURITY INVOKER)
create view v_maintenance_areas_with_count with (security_invoker = true) as
select ma.*,
  lt_ma.name as maintenance_area_type_name,
  lt_ma.code as maintenance_area_type_code,
  lt_ma.category as maintenance_area_type_category,
  lt_ma.sort_order as maintenance_area_type_sort_order,
  lt_ma.is_system_default as maintenance_area_type_is_system_default,
  lt_ma.status as maintenance_area_type_status,
  lt_ma.created_at as maintenance_area_type_created_at,
  lt_ma.updated_at as maintenance_area_type_updated_at,
  count(*) OVER() AS total_count,
  sum(CASE WHEN ma.status = true THEN 1 ELSE 0 END) OVER() AS active_count,
  sum(CASE WHEN ma.status = false THEN 1 ELSE 0 END) OVER() AS inactive_count
from maintenance_areas ma
  left join lookup_types lt_ma on ma.area_type_id = lt_ma.id;