drop view if exists v_ofc_connections_complete;
create view v_ofc_connections_complete with (security_invoker = true) as
select 
  oc.id::uuid,
  oc.ofc_id::uuid,
  oc.fiber_no_sn::integer,
  oc.fiber_no_en::integer,
  oc.otdr_distance_sn_km::numeric(10,3),
  oc.sn_dom::date,
  oc.sn_power_dbm::numeric(10,3),
  oc.system_id::uuid,
  oc.otdr_distance_en_km::numeric(10,3),
  oc.en_dom::date,
  oc.en_power_dbm::numeric(10,3),
  oc.route_loss_db::numeric(10,3),
  oc.logical_path_id::uuid,
  oc.fiber_role::text,
  oc.path_segment_order::integer,
  oc.source_port::text,
  oc.destination_port::text,
  oc.connection_category::text,
  oc.connection_type::text,
  oc.remark::text,
  oc.status::boolean,
  oc.created_at::timestamptz,
  oc.updated_at::timestamptz,
  ofc.route_name as ofc_route_name,
  ma.name as maintenance_area_name,
  ofc.sn_id::uuid, 
  ofc.en_id::uuid, 
  ofc_type.name as ofc_type_name,
  na.name as sn_name, 
  s.system_name as system_name, 
  nb.name as en_name,
  count(*) OVER()::integer AS total_count,
  sum(case when oc.status = true then 1 else 0 end) over()::integer as active_count,
  sum(case when oc.status = false then 1 else 0 end) over()::integer as inactive_count
from ofc_connections oc
  join ofc_cables ofc on oc.ofc_id = ofc.id
  join lookup_types ofc_type on ofc.ofc_type_id = ofc_type.id
  left join nodes na on ofc.sn_id = na.id
  left join nodes nb on ofc.en_id = nb.id
  left join systems s on oc.system_id = s.id
  left join maintenance_areas ma on ofc.maintenance_terminal_id = ma.id;