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
  count(*) OVER() AS total_count,
  sum(CASE WHEN r.status = true THEN 1 ELSE 0 END) OVER() AS active_count,
  sum(CASE WHEN r.status = false THEN 1 ELSE 0 END) OVER() AS inactive_count
from rings r
  left join lookup_types lt_ring on r.ring_type_id = lt_ring.id;