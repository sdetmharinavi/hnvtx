-- Function: get_paged_ofc_connections_complete
DROP FUNCTION IF EXISTS public.get_paged_ofc_connections_complete;
CREATE OR REPLACE FUNCTION public.get_paged_ofc_connections_complete(
    p_limit integer,
    p_offset integer,
    p_order_by text DEFAULT 'ofc_route_name', -- Changed default to a valid column
    p_order_dir text DEFAULT 'asc',
    p_filters jsonb DEFAULT '{}'::jsonb
) 
RETURNS TABLE(
    -- Replaced with columns from v_ofc_connections_complete
    id text,
    ofc_id text,
    ofc_route_name text,
    ofc_type_name text,
    sn_id text,
    sn_name text,
    sn_dom text,
    fiber_no_sn integer,
    system_sn_name text,
    otdr_distance_sn_km numeric,
    en_id text,
    en_name text,
    en_dom text,
    fiber_no_en integer,
    system_en_name text,
    otdr_distance_en_km numeric,
    status boolean,
    remark text,
    created_at text,
    updated_at text,
    total_count bigint
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
      -- Replaced with columns from v_ofc_connections_complete
      v.id::text,
      v.ofc_id::text,
      v.ofc_route_name::text,
      v.ofc_type_name::text,
      v.sn_id::text,
      v.sn_name::text,
      v.sn_dom::text,
      v.fiber_no_sn,
      v.system_sn_name::text,
      v.otdr_distance_sn_km,
      v.en_id::text,
      v.en_name::text,
      v.en_dom::text,
      v.fiber_no_en,
      v.system_en_name::text,
      v.otdr_distance_en_km,
      v.status,
      v.remark::text,
      v.created_at::text,
      v.updated_at::text,
      count(*) OVER() AS total_count
      sum(CASE WHEN v.status THEN 1 ELSE 0 END) OVER() AS active_count,
      sum(CASE WHEN NOT v.status THEN 1 ELSE 0 END) OVER() AS inactive_count
    FROM public.v_ofc_connections_complete v -- Corrected the view name
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

-- Corrected the function name in the GRANT and ALTER statements
GRANT EXECUTE ON FUNCTION public.get_paged_ofc_connections_complete(integer, integer, text, text, jsonb) TO authenticated;
ALTER FUNCTION public.get_paged_ofc_connections_complete(integer, integer, text, text, jsonb)
SET search_path = public, auth, pg_temp;