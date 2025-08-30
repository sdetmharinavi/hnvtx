-- This view now joins the new 'sfp_based_connections' table.
drop view if exists v_system_connections_complete;
create or replace view v_system_connections_complete with (security_invoker = true) as
select
  sc.id, sc.system_id, s.system_name, lt_system.name as system_type_name,
  s_sn.system_name as sn_name, na.name as sn_node_name, sc.sn_ip, sc.sn_interface,
  s_en.system_name as en_name, nb.name as en_node_name, sc.en_ip, sc.en_interface,
  lt_media.name as media_type_name, sc.bandwidth_mbps, cs.system_name as connected_system_name,
  lt_cs_type.name as connected_system_type_name, sc.vlan, sc.commissioned_on,
  sc.remark, sc.status, sc.created_at, sc.updated_at,
  -- SFP-based details (from consolidated table)
  sfpc.sfp_port, lt_sfp.name as sfp_type_name, sfpc.sfp_capacity,
  sfpc.sfp_serial_no, sfpc.fiber_in, sfpc.fiber_out, sfpc.customer_name, sfpc.bandwidth_allocated_mbps,
  -- SDH details
  scs.stm_no as sdh_stm_no, scs.carrier as sdh_carrier, scs.a_slot as sdh_a_slot,
  scs.a_customer as sdh_a_customer, scs.b_slot as sdh_b_slot, scs.b_customer as sdh_b_customer,
  -- VMUX details
  vcs.subscriber as vmux_subscriber, vcs.c_code as vmux_c_code, vcs.channel as vmux_channel, vcs.tk as vmux_tk,
  count(*) OVER() AS total_count,
  sum(case when sc.status = true then 1 else 0 end) over() as active_count,
  sum(case when sc.status = false then 1 else 0 end) over() as inactive_count
from system_connections sc
  join systems s on sc.system_id = s.id
  join lookup_types lt_system on s.system_type_id = lt_system.id
  left join systems s_sn on sc.sn_id = s_sn.id
  left join nodes na on s_sn.node_id = na.id
  left join systems s_en on sc.en_id = s_en.id
  left join nodes nb on s_en.node_id = nb.id
  left join systems cs on sc.connected_system_id = cs.id
  left join lookup_types lt_cs_type on cs.system_type_id = lt_cs_type.id
  left join lookup_types lt_media on sc.media_type_id = lt_media.id
  left join sfp_based_connections sfpc on sc.id = sfpc.system_connection_id
  left join lookup_types lt_sfp on sfpc.sfp_type_id = lt_sfp.id
  left join sdh_connections scs on sc.id = scs.system_connection_id
  left join vmux_connections vcs on sc.id = vcs.system_connection_id;