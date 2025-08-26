-- Complete Node Information View (SECURITY INVOKER)
create view v_nodes_complete with (security_invoker = true) as
select n.*,
  r.name as ring_name,
  r.ring_type_id,
  lt_node.name as node_type_name,
  lt_node.code as node_type_code,
  lt_ring.name as ring_type_name,
  lt_ring.code as ring_type_code,
  ma.name as maintenance_area_name,
  ma.code as maintenance_area_code,
  lt_ma.name as maintenance_area_type_name,
  count(*) OVER() AS total_count,
  sum(CASE WHEN n.status = true THEN 1 ELSE 0 END) OVER() AS active_count,
  sum(CASE WHEN n.status = false THEN 1 ELSE 0 END) OVER() AS inactive_count

from nodes n
  left join rings r on n.ring_id = r.id
  left join lookup_types lt_node on n.node_type_id = lt_node.id
  left join lookup_types lt_ring on r.ring_type_id = lt_ring.id
  left join maintenance_areas ma on n.maintenance_terminal_id = ma.id
  left join lookup_types lt_ma on ma.area_type_id = lt_ma.id;