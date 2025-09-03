-- Complete OFC Cables View (SECURITY INVOKER)
CREATE VIEW v_ofc_cables_complete WITH (security_invoker = true) AS
SELECT 
  ofc.asset_no,
  ofc.capacity,
  ofc.commissioned_on,
  ofc.created_at,
  ofc.current_rkm,
  ofc.en_id,
  ofc.id,
  ofc.maintenance_terminal_id,
  ofc.ofc_owner_id,
  ofc.ofc_type_id,
  ofc.remark,
  ofc.route_name,
  ofc.sn_id,
  ofc.status,
  ofc.transnet_id,
  ofc.transnet_rkm,
  ofc.updated_at,
  lt_ofc.name as ofc_type_name,
  lt_ofc.code as ofc_type_code,
  lt_ofc_owner.name as ofc_owner_name,
  lt_ofc_owner.code as ofc_owner_code,
  ma.name as maintenance_area_name,
  ma.code as maintenance_area_code,
  count(*) OVER() AS total_count,
  sum(CASE WHEN ofc.status = true THEN 1 ELSE 0 END) OVER() AS active_count,
  sum(CASE WHEN ofc.status = false THEN 1 ELSE 0 END) OVER() AS inactive_count
FROM ofc_cables ofc
JOIN lookup_types lt_ofc ON ofc.ofc_type_id = lt_ofc.id
LEFT JOIN lookup_types lt_ofc_owner ON ofc.ofc_owner_id = lt_ofc_owner.id
LEFT JOIN maintenance_areas ma ON ofc.maintenance_terminal_id = ma.id;