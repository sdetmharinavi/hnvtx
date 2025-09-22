-- Complete OFC Cables View (SECURITY INVOKER) - VERSION 2 (Corrected with Node Joins)
DROP VIEW IF EXISTS v_ofc_cables_complete;
CREATE VIEW v_ofc_cables_complete WITH (security_invoker = true) AS
SELECT
  ofc.id,
  ofc.route_name,
  ofc.sn_id,
  ofc.en_id,
  sn.name as sn_name, -- ADDED: Start Node Name
  en.name as en_name, -- ADDED: End Node Name
  ofc.capacity,
  ofc.ofc_type_id,
  lt_ofc.name as ofc_type_name,
  lt_ofc.code as ofc_type_code,
  ofc.ofc_owner_id,
  lt_ofc_owner.name as ofc_owner_name,
  lt_ofc_owner.code as ofc_owner_code,
  ofc.asset_no,
  ofc.transnet_id,
  ofc.transnet_rkm,
  ofc.current_rkm,
  ofc.maintenance_terminal_id,
  ma.name as maintenance_area_name,
  ma.code as maintenance_area_code,
  ofc.commissioned_on,
  ofc.status,
  ofc.remark,
  ofc.created_at,
  ofc.updated_at,
  count(*) OVER() AS total_count,
  sum(CASE WHEN ofc.status = true THEN 1 ELSE 0 END) OVER() AS active_count,
  sum(CASE WHEN ofc.status = false THEN 1 ELSE 0 END) OVER() AS inactive_count
FROM ofc_cables ofc
  LEFT JOIN nodes sn ON ofc.sn_id = sn.id -- ADDED: Join for Start Node
  LEFT JOIN nodes en ON ofc.en_id = en.id -- ADDED: Join for End Node
  LEFT JOIN lookup_types lt_ofc ON ofc.ofc_type_id = lt_ofc.id
  LEFT JOIN lookup_types lt_ofc_owner ON ofc.ofc_owner_id = lt_ofc_owner.id
  LEFT JOIN maintenance_areas ma ON ofc.maintenance_terminal_id = ma.id;