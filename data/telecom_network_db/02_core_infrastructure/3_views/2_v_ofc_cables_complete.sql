-- Complete OFC Cables View (SECURITY INVOKER)
create view v_ofc_cables_complete with (security_invoker = true) as
select ofc.*,
  lt_ofc.name as ofc_type_name,
  lt_ofc.code as ofc_type_code,
  lt_ofc_owner.name as ofc_owner_name,
  lt_ofc_owner.code as ofc_owner_code,
  ma.name as maintenance_area_name,
  ma.code as maintenance_area_code
from ofc_cables ofc
  join lookup_types lt_ofc on ofc.ofc_type_id = lt_ofc.id
  left join lookup_types lt_ofc_owner on ofc.ofc_owner_id = lt_ofc_owner.id
  left join maintenance_areas ma on ofc.maintenance_terminal_id = ma.id;