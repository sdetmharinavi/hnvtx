-- OFC Connections View (SECURITY INVOKER)
create view v_ofc_connections_complete with (security_invoker = true) as
select oc.id,
  oc.ofc_id,
  ofc.route_name as ofc_route_name,
  ofc.sn_id,
  ofc.en_id,
  ofc_type.name as ofc_type_name,
  na.name as sn_name,
  oc.fiber_no_sn,
  oc.otdr_distance_sn_km,
  oc.sn_dom,
  sa.system_name as system_sn_name,
  nb.name as en_name,
  oc.fiber_no_en,
  oc.otdr_distance_en_km,
  oc.en_dom,
  sb.system_name as system_en_name,
  oc.remark,
  oc.status,
  oc.created_at,
  oc.updated_at
from ofc_connections oc
  join ofc_cables ofc on oc.ofc_id = ofc.id
  join lookup_types ofc_type on ofc.ofc_type_id = ofc_type.id
  left join nodes na on ofc.sn_id = na.id
  left join nodes nb on ofc.en_id = nb.id
  left join systems sa on oc.system_sn_id = sa.id
  left join systems sb on oc.system_en_id = sb.id;