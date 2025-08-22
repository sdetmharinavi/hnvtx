-- Function: get_paged_ofc_cables_complete
DROP FUNCTION IF EXISTS public.get_paged_ofc_cables_complete;
CREATE OR REPLACE FUNCTION public.get_paged_ofc_cables_complete(
    p_limit integer,
    p_offset integer,
    p_order_by text DEFAULT 'route_name',
    p_order_dir text DEFAULT 'asc',
    p_filters jsonb DEFAULT '{}'::jsonb
) 
RETURNS TABLE(
    id text,
    asset_no text,
    route_name text,
    sn_id text,
    en_id text,
    capacity integer,
    commissioned_on text,
    created_at text,
    current_rkm numeric,
    maintenance_area_code text,
    maintenance_area_name text,
    maintenance_terminal_id text,
    ofc_type_code text,
    ofc_type_id text,
    ofc_type_name text,
    remark text,
    status boolean,
    transnet_id text,
    transnet_rkm numeric,
    updated_at text,
    total_count bigint,
    active_count bigint,
    inactive_count bigint
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
        IF jsonb_typeof(filter_value) = 'boolean' THEN 
          where_clause := where_clause || format(' AND %I = %L', filter_key, filter_value::text::boolean);
        ELSIF filter_key = 'or' THEN 
          where_clause := where_clause || format(' AND %s', filter_value->>0);
        ELSE 
          where_clause := where_clause || format(
            ' AND %I::text ILIKE %L',
            filter_key,
            '%' || trim(BOTH '"' FROM filter_value::text) || '%'
          );
        END IF;
      END IF;
    END LOOP;
  END IF;

  sql_query := format(
    $query$
    SELECT 
      v.id::text,
      v.asset_no::text,
      v.route_name::text,
      v.sn_id::text,
      v.en_id::text,
      v.capacity,
      v.commissioned_on::text,
      v.created_at::text,
      v.current_rkm,
      v.maintenance_area_code::text,
      v.maintenance_area_name::text,
      v.maintenance_terminal_id::text,
      v.ofc_type_code::text,
      v.ofc_type_id::text,
      v.ofc_type_name::text,
      v.remark::text,
      v.status,
      v.transnet_id::text,
      v.transnet_rkm,
      v.updated_at::text,
      count(*) OVER() AS total_count,
      sum(CASE WHEN v.status THEN 1 ELSE 0 END) OVER() AS active_count,
      sum(CASE WHEN NOT v.status THEN 1 ELSE 0 END) OVER() AS inactive_count
    FROM public.v_ofc_cables_complete v
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

GRANT EXECUTE ON FUNCTION public.get_paged_ofc_cables_complete(integer, integer, text, text, jsonb) TO authenticated;
ALTER FUNCTION public.get_paged_ofc_cables_complete(integer, integer, text, text, jsonb)
SET search_path = public, auth, pg_temp;