-- Complete Node Information View (SECURITY INVOKER)
create or replace view v_nodes_complete
with (security_invoker = true) as
select 
  n.*,
  lt_node.name as node_type_name,
  lt_node.code as node_type_code,
  ma.name as maintenance_area_name,
  ma.code as maintenance_area_code,
  lt_ma.name as maintenance_area_type_name,
  count(*) OVER() AS total_count,
  sum(case when n.status = true then 1 else 0 end) over() as active_count,
  sum(case when n.status = false then 1 else 0 end) over() as inactive_count

from nodes n
  left join lookup_types lt_node on n.node_type_id = lt_node.id
  left join maintenance_areas ma on n.maintenance_terminal_id = ma.id
  left join lookup_types lt_ma on ma.area_type_id = lt_ma.id;
