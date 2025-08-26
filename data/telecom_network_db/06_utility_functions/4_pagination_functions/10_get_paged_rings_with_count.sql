-- Function: get_paged_rings_with_count
DROP FUNCTION IF EXISTS public.get_paged_rings_with_count;
CREATE OR REPLACE FUNCTION public.get_paged_rings_with_count(
    p_limit integer,
    p_offset integer,
    p_order_by text DEFAULT 'name',
    p_order_dir text DEFAULT 'asc',
    p_filters jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(
    id text,
    name text,
    ring_type_id text,
    description text,
    maintenance_terminal_id text,
    total_nodes integer,
    status boolean,
    created_at text,
    updated_at text,
    ring_type_name text,
    ring_type_code text,
    ring_type_category text,
    ring_type_sort_order integer,
    ring_type_is_system_default boolean,
    ring_type_status boolean,
    ring_type_created_at text,
    ring_type_updated_at text,
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
        ELSIF right(filter_key, 3) = '_id' THEN
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
      r.id::text,
      r.name::text,
      r.ring_type_id::text,
      r.description::text,
      r.maintenance_terminal_id::text,
      r.total_nodes::integer,
      r.status::boolean,
      r.created_at::text,
      r.updated_at::text,
      r.ring_type_name::text,
      r.ring_type_code::text,
      r.ring_type_category::text,
      r.ring_type_sort_order::integer,
      r.ring_type_is_system_default::boolean,
      r.ring_type_status::boolean,
      r.ring_type_created_at::text,
      r.ring_type_updated_at::text,
      count(*) OVER() AS total_count,
      sum(CASE WHEN r.status THEN 1 ELSE 0 END) OVER() AS active_count,
      sum(CASE WHEN NOT r.status THEN 1 ELSE 0 END) OVER() AS inactive_count
    FROM public.v_rings_with_count r
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

GRANT EXECUTE ON FUNCTION public.get_paged_rings_with_count(integer, integer, text, text, jsonb) TO authenticated;
ALTER FUNCTION public.get_paged_rings_with_count(integer, integer, text, text, jsonb)
SET search_path = public, auth, pg_temp;