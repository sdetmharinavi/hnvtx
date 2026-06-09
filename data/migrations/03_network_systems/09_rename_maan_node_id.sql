-- data/migrations/03_network_systems/09_rename_maan_node_id.sql

-- 1. Drop the dependent view
DROP VIEW IF EXISTS public.v_systems_complete CASCADE;

-- 2. Rename the column in the systems table
ALTER TABLE public.systems RENAME COLUMN maan_node_id TO unique_id;

-- 3. Recreate the view with the new column name
CREATE OR REPLACE VIEW public.v_systems_complete WITH (security_invoker = true) AS
SELECT
  s.id,
  s.system_type_id,
  s.unique_id, -- formerly maan_node_id
  s.node_id,
  s.system_name,
  s.is_hub,
  s.system_capacity_id,
  s.ip_address::text,
  s.maintenance_terminal_id,
  s.commissioned_on,
  s.s_no,
  s.asset_no,
  s.make,
  s.remark,
  s.status,
  s.created_at,
  s.updated_at,
  n.name AS node_name,
  lt_node_type.name AS node_type_name,
  lt_system.is_ring_based,
  n.latitude,
  n.longitude,
  lt_system.name AS system_type_name,
  lt_system.code AS system_type_code,
  lt_system.category AS system_category,
  lt_capacity.name AS system_capacity_name,
  ma.name AS system_maintenance_terminal_name,
  r_agg.ring_associations,
  (r_agg.ring_associations->0->>'ring_id')::UUID AS ring_id,
  (r_agg.ring_associations->0->>'order_in_ring')::NUMERIC AS order_in_ring,
  (r_agg.ring_associations->0->>'ring_logical_area_name')::TEXT AS ring_logical_area_name
FROM public.systems s
  JOIN public.nodes n ON s.node_id = n.id
  JOIN public.lookup_types lt_system ON s.system_type_id = lt_system.id
  LEFT JOIN public.lookup_types lt_capacity ON s.system_capacity_id = lt_capacity.id
  LEFT JOIN public.lookup_types lt_node_type ON n.node_type_id = lt_node_type.id
  LEFT JOIN public.maintenance_areas ma ON s.maintenance_terminal_id = ma.id
  LEFT JOIN LATERAL (
     SELECT
        jsonb_agg(
            jsonb_build_object(
                'ring_id', r.id,
                'ring_name', r.name,
                'order_in_ring', rbs.order_in_ring,
                'ring_logical_area_name', ra.name
            ) ORDER BY rbs.order_in_ring
        ) AS ring_associations
     FROM public.ring_based_systems rbs
     JOIN public.rings r ON rbs.ring_id = r.id
     LEFT JOIN public.maintenance_areas ra ON rbs.maintenance_area_id = ra.id
     WHERE rbs.system_id = s.id
  ) r_agg ON true;

GRANT SELECT ON public.v_systems_complete TO admin, admin_pro, viewer, cpan_admin, sdh_admin, asset_admin, mng_admin, authenticated;

-- 4. Drop the existing function signatures to allow parameter renaming
DROP FUNCTION IF EXISTS public.upsert_system_with_details(
    TEXT, UUID, UUID, BOOLEAN, BOOLEAN, TEXT, INET, UUID, DATE, TEXT, TEXT, UUID, JSONB, TEXT, UUID, TEXT
);
DROP FUNCTION IF EXISTS public.upsert_system_with_details(
    TEXT, UUID, UUID, BOOLEAN, BOOLEAN, TEXT, INET, UUID, DATE, TEXT, TEXT, UUID, JSONB, TEXT, UUID
);

-- 5. Recreate the UPSERT RPC function accepting p_unique_id
CREATE OR REPLACE FUNCTION public.upsert_system_with_details(
    p_system_name TEXT,
    p_system_type_id UUID,
    p_node_id UUID,
    p_status BOOLEAN,
    p_is_hub BOOLEAN,
    p_unique_id TEXT DEFAULT NULL, -- Changed from p_maan_node_id
    p_ip_address INET DEFAULT NULL,
    p_maintenance_terminal_id UUID DEFAULT NULL,
    p_commissioned_on DATE DEFAULT NULL,
    p_s_no TEXT DEFAULT NULL,
    p_remark TEXT DEFAULT NULL,
    p_id UUID DEFAULT NULL,
    p_ring_associations JSONB DEFAULT NULL,
    p_make TEXT DEFAULT NULL,
    p_system_capacity_id UUID DEFAULT NULL,
    p_asset_no TEXT DEFAULT NULL
)
RETURNS SETOF public.systems
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_system_id UUID;
    v_system_type_record public.lookup_types;
    ring_assoc_record RECORD;
BEGIN
    SELECT * INTO v_system_type_record FROM public.lookup_types WHERE id = p_system_type_id;

    INSERT INTO public.systems (
        id, system_name, system_type_id, unique_id, node_id, ip_address,
        maintenance_terminal_id, commissioned_on, s_no, remark, status, make, is_hub, system_capacity_id, asset_no
    ) VALUES (
        COALESCE(p_id, gen_random_uuid()), p_system_name, p_system_type_id, p_unique_id, p_node_id, p_ip_address,
        p_maintenance_terminal_id, p_commissioned_on, p_s_no, p_remark, p_status, p_make, p_is_hub, p_system_capacity_id, p_asset_no
    )
    ON CONFLICT (id) DO UPDATE SET
        system_name = EXCLUDED.system_name,
        system_type_id = EXCLUDED.system_type_id,
        unique_id = EXCLUDED.unique_id,
        node_id = EXCLUDED.node_id,
        ip_address = EXCLUDED.ip_address,
        maintenance_terminal_id = EXCLUDED.maintenance_terminal_id,
        commissioned_on = EXCLUDED.commissioned_on,
        s_no = EXCLUDED.s_no,
        remark = EXCLUDED.remark,
        status = EXCLUDED.status,
        make = EXCLUDED.make,
        is_hub = EXCLUDED.is_hub,
        system_capacity_id = EXCLUDED.system_capacity_id,
        asset_no = EXCLUDED.asset_no,
        updated_at = NOW()
    RETURNING id INTO v_system_id;

    IF v_system_type_record.is_ring_based = true AND p_ring_associations IS NOT NULL AND jsonb_array_length(p_ring_associations) > 0 THEN
        FOR ring_assoc_record IN SELECT * FROM jsonb_to_recordset(p_ring_associations) AS x(ring_id UUID, order_in_ring NUMERIC)
        LOOP
            INSERT INTO public.ring_based_systems (system_id, ring_id, order_in_ring)
            VALUES (v_system_id, ring_assoc_record.ring_id, ring_assoc_record.order_in_ring)
            ON CONFLICT (system_id, ring_id) DO UPDATE SET
                order_in_ring = EXCLUDED.order_in_ring;
        END LOOP;
    END IF;

    RETURN QUERY SELECT * FROM public.systems WHERE id = v_system_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_system_with_details(TEXT, UUID, UUID, BOOLEAN, BOOLEAN, TEXT, INET, UUID, DATE, TEXT, TEXT, UUID, JSONB, TEXT, UUID, TEXT) TO authenticated;