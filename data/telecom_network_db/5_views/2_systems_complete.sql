-- Complete System Information View (SECURITY INVOKER)
create view v_systems_complete with (security_invoker = true) as
select s.id,
  s.system_name,
  s.ip_address,
  s.commissioned_on,
  s.remark,
  s.status,
  s.created_at,
  s.updated_at,
  n.name as node_name,
  n.latitude,
  n.longitude,
  n.ip_address as node_ip,
  lt_system.name as system_type_name,
  lt_system.code as system_type_code,
  lt_system.category as system_category,
  ma.name as maintenance_area_name,
  ms.ring_no as maan_ring_no,
  ms.area as maan_area,
  ss.gne as sdh_gne,
  ss.make as sdh_make,
  vs.vm_id as vmux_vm_id
from systems s
  join nodes n on s.node_id = n.id
  join lookup_types lt_system on s.system_type_id = lt_system.id
  left join maintenance_areas ma on s.maintenance_terminal_id = ma.id
  left join cpan_systems cs on s.id = cs.system_id
  left join maan_systems ms on s.id = ms.system_id
  left join sdh_systems ss on s.id = ss.system_id
  left join vmux_systems vs on s.id = vs.system_id;