-- Function: get_paged_v_systems_complete
DROP FUNCTION IF EXISTS get_paged_v_systems_complete;
CREATE OR REPLACE FUNCTION get_paged_v_systems_complete(
    p_limit integer,
    p_offset integer,
    p_order_by text DEFAULT 'system_name',
    p_order_dir text DEFAULT 'asc',
    p_filters jsonb DEFAULT '{}'::jsonb
) 
RETURNS TABLE(
    commissioned_on text,
    created_at text,
    id text,
    ip_address inet,
    latitude numeric,
    longitude numeric,
    maan_area text,
    maan_ring_no text,
    maintenance_area_name text,
    node_ip inet,
    node_name text,
    remark text,
    s_no text,
    sdh_gne text,
    sdh_make text,
    status boolean,
    system_category text,
    system_name text,
    system_type_code text,
    system_type_name text,
    updated_at text,
    vmux_vm_id text,
    total_count bigint
) 
AS $$
DECLARE 
  sql_query text;
  where_clause text := '';
  filter_key text;
  filter_value jsonb;
BEGIN 
  IF p_filters IS NOT NULL AND jsonb_typeof(p_filters) = 'object' THEN 
    FOR filter_key, filter_value IN SELECT * FROM jsonb_each(p_filters) 
    LOOP 
      IF filter_value IS NOT NULL AND filter_value::text != '""' THEN 
        where_clause := where_clause || format(
          ' AND %I::text ILIKE %L',
          filter_key,
          '%' || trim(filter_value::text, '"') || '%'
        );
      END IF;
    END LOOP;
  END IF;

  sql_query := format(
    $query$
    SELECT 
      v.commissioned_on::text,
      v.created_at::text,
      v.id::text,
      v.ip_address,
      v.latitude::numeric,
      v.longitude::numeric,
      v.maan_area,
      v.maan_ring_no,
      v.maintenance_area_name,
      v.node_ip,
      v.node_name,
      v.remark,
      v.s_no,
      v.sdh_gne,
      v.sdh_make,
      v.status,
      v.system_category,
      v.system_name,
      v.system_type_code,
      v.system_type_name,
      v.updated_at::text,
      v.vmux_vm_id,
      count(*) OVER() AS total_count
    FROM public.v_systems_complete v
    WHERE 1 = 1 %s
    ORDER BY %I %s
    LIMIT %L OFFSET %L 
    $query$,
    where_clause,
    p_order_by,
    p_order_dir,
    p_limit,
    p_offset
  );

  RETURN QUERY EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_paged_v_systems_complete(integer, integer, text, text, jsonb) TO authenticated;
ALTER FUNCTION public.get_paged_v_systems_complete(integer, integer, text, text, jsonb)
SET search_path = public, auth, pg_temp;