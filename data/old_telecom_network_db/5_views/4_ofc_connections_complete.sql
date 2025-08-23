-- OFC Connections View (SECURITY INVOKER)
create view v_ofc_connections_complete with (security_invoker = true) as
select oc.id,
  oc.ofc_id,
  ofc.route_name as ofc_route_name,
  ma.name as maintenance_area_name,
  ofc.sn_id,
  ofc.en_id,
  ofc_type.name as ofc_type_name,
  na.name as sn_name,
  oc.fiber_no_sn,
  oc.otdr_distance_sn_km,
  oc.sn_dom,
  s.system_name as system_name,
  nb.name as en_name,
  oc.fiber_no_en,
  oc.otdr_distance_en_km,
  oc.en_dom,
  oc.remark,
  oc.status,
  oc.created_at,
  oc.updated_at
from ofc_connections oc
  join ofc_cables ofc on oc.ofc_id = ofc.id
  join lookup_types ofc_type on ofc.ofc_type_id = ofc_type.id
  left join nodes na on ofc.sn_id = na.id
  left join nodes nb on ofc.en_id = nb.id
  left join systems s on oc.system_id = s.id
  left join maintenance_areas ma on ofc.maintenance_terminal_id = ma.id;
