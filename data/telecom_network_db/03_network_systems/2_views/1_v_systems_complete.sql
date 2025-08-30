-- This view joins the new 'ring_based_systems' table and uses clearer aliases.
drop view if exists v_systems_complete;
create view v_systems_complete with (security_invoker = true) as
select
  s.*,
  n.name as node_name,
  n.latitude,
  n.longitude,
  lt_system.name as system_type_name,
  lt_system.code as system_type_code,
  lt_system.category as system_category,
  ma.name as system_maintenance_terminal_name,
  rbs.ring_id as ring_id,
  ring_area.name as ring_logical_area_name,
  ss.gne as sdh_gne,
  ss.make as sdh_make,
  vs.vm_id as vmux_vm_id,
  count(*) OVER() AS total_count,
  sum(case when s.status = true then 1 else 0 end) over() as active_count,
  sum(case when s.status = false then 1 else 0 end) over() as inactive_count
from systems s
  join nodes n on s.node_id = n.id
  join lookup_types lt_system on s.system_type_id = lt_system.id
  left join maintenance_areas ma on s.maintenance_terminal_id = ma.id
  left join ring_based_systems rbs on s.id = rbs.system_id
  left join maintenance_areas ring_area on rbs.maintenance_area_id = ring_area.id
  left join sdh_systems ss on s.id = ss.system_id
  left join vmux_systems vs on s.id = vs.system_id;
