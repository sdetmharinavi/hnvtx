-- Function: get_paged_nodes_complete
DROP FUNCTION IF EXISTS public.get_paged_nodes_complete;
CREATE OR REPLACE FUNCTION public.get_paged_nodes_complete(
    p_limit integer,
    p_offset integer,
    p_order_by text DEFAULT 'name',
    p_order_dir text DEFAULT 'asc',
    p_filters jsonb DEFAULT '{}'::jsonb
) 
RETURNS TABLE(
    id text,
    name text,
    builtup text,
    created_at text,
    east_port text,
    ip_address inet,
    latitude numeric,
    longitude numeric,
    maintenance_area_code text,
    maintenance_area_name text,
    maintenance_area_type_name text,
    maintenance_terminal_id text,
    node_type_code text,
    node_type_id text,
    node_type_name text,
    order_in_ring numeric,
    remark text,
    ring_id text,
    ring_name text,
    ring_status text,
    ring_type_code text,
    ring_type_id text,
    ring_type_name text,
    site_id text,
    status boolean,
    updated_at text,
    vlan text,
    west_port text,
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
        ELSIF right(filter_key, 3) = '_id' THEN
          -- For id fields, use exact match instead of ILIKE
          where_clause := where_clause || format(
            ' AND %I::text = %L',
            filter_key,
            trim(BOTH '"' FROM filter_value::text)
          );
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
      v.name::text,
      v.builtup::text,
      v.created_at::text,
      v.east_port::text,
      v.ip_address,
      v.latitude::numeric,
      v.longitude::numeric,
      v.maintenance_area_code::text,
      v.maintenance_area_name::text,
      v.maintenance_area_type_name::text,
      v.maintenance_terminal_id::text,
      v.node_type_code::text,
      v.node_type_id::text,
      v.node_type_name::text,
      v.order_in_ring::numeric,
      v.remark::text,
      v.ring_id::text,
      v.ring_name::text,
      v.ring_status::text,
      v.ring_type_code::text,
      v.ring_type_id::text,
      v.ring_type_name::text,
      v.site_id::text,
      v.status,
      v.updated_at::text,
      v.vlan::text,
      v.west_port::text,
      count(*) OVER() AS total_count
      sum(CASE WHEN v.status THEN 1 ELSE 0 END) OVER() AS active_count,
      sum(CASE WHEN NOT v.status THEN 1 ELSE 0 END) OVER() AS inactive_count
    FROM public.v_nodes_complete v
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

GRANT EXECUTE ON FUNCTION public.get_paged_nodes_complete(integer, integer, text, text, jsonb) TO authenticated;
ALTER FUNCTION public.get_paged_nodes_complete(integer, integer, text, text, jsonb)
SET search_path = public, auth, pg_temp;