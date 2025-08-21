-- System Connections with Lookup Details View (SECURITY INVOKER)
create view v_system_connections_complete with (security_invoker = true) as
select sc.id,
  sc.system_id,
  s.system_name,
  lt_system.name as system_type_name,
  na.name as node_a_name,
  nb.name as node_b_name,
  sc.sn_ip,
  sc.sn_interface,
  sc.en_ip,
  sc.en_interface,
  lt_media.name as media_type_name,
  sc.bandwidth_mbps,
  cs.system_name as connected_system_name,
  lt_cs_type.name as connected_system_type_name,
  sc.vlan,
  sc.commissioned_on,
  sc.remark,
  sc.status,
  sc.created_at,
  sc.updated_at,
  mcs.sfp_port as maan_sfp_port,
  lt_sfp.name as maan_sfp_type_name,
  mcs.sfp_capacity as maan_sfp_capacity,
  mcs.sfp_serial_no as maan_sfp_serial_no,
  mcs.fiber_in as maan_fiber_in,
  mcs.fiber_out as maan_fiber_out,
  mcs.customer_name as maan_customer_name,
  mcs.bandwidth_allocated_mbps as maan_bandwidth_allocated_mbps,
  scs.stm_no as sdh_stm_no,
  scs.carrier as sdh_carrier,
  scs.a_slot as sdh_a_slot,
  scs.a_customer as sdh_a_customer,
  scs.b_slot as sdh_b_slot,
  scs.b_customer as sdh_b_customer,
  vcs.subscriber as vmux_subscriber,
  vcs.c_code as vmux_c_code,
  vcs.channel as vmux_channel,
  vcs.tk as vmux_tk
from system_connections sc
  join systems s on sc.system_id = s.id
  join lookup_types lt_system on s.system_type_id = lt_system.id
  left join nodes na on sc.node_a_id = na.id
  left join nodes nb on sc.node_b_id = nb.id
  left join systems cs on sc.connected_system_id = cs.id
  left join lookup_types lt_cs_type on cs.system_type_id = lt_cs_type.id
  left join lookup_types lt_media on sc.media_type_id = lt_media.id
  left join maan_connections mcs on sc.id = mcs.system_connection_id
  left join sdh_connections scs on sc.id = scs.system_connection_id
  left join vmux_connections vcs on sc.id = vcs.system_connection_id
  left join lookup_types lt_sfp on mcs.sfp_type_id = lt_sfp.id;