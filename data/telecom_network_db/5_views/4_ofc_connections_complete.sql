-- OFC Connections View (SECURITY INVOKER)
create view v_ofc_connections_complete with (security_invoker = true) as
select oc.id,
  oc.ofc_id,
  ofc.route_name as ofc_route_name,
  ofc.starting_node_id,
  ofc.ending_node_id,
  ofc_type.name as ofc_type_name,
  na.name as node_a_name,
  oc.fiber_no_ea,
  oc.otdr_distance_ea_km,
  oc.ea_dom,
  sa.system_name as system_a_name,
  nb.name as node_b_name,
  oc.fiber_no_eb,
  oc.otdr_distance_eb_km,
  oc.eb_dom,
  sb.system_name as system_b_name,
  oc.remark,
  oc.status,
  oc.created_at,
  oc.updated_at
from ofc_connections oc
  join ofc_cables ofc on oc.ofc_id = ofc.id
  join lookup_types ofc_type on ofc.ofc_type_id = ofc_type.id
  left join nodes na on oc.node_a_id = na.id
  left join nodes nb on oc.node_b_id = nb.id
  left join systems sa on oc.system_a_id = sa.id
  left join systems sb on oc.system_b_id = sa.id;