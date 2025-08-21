-- Function: get_unique_values
CREATE OR REPLACE FUNCTION get_unique_values(
    table_name TEXT,
    column_name TEXT,
    filters JSONB DEFAULT '{}'::jsonb,
    order_by JSONB DEFAULT '[]'::jsonb,
    limit_count INTEGER DEFAULT NULL
) 
RETURNS TABLE(value JSONB) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp 
AS $$
DECLARE 
  query_text TEXT;
  where_clause TEXT := '';
  order_clause TEXT := '';
  limit_clause TEXT := '';
BEGIN 
  IF jsonb_typeof(filters) = 'object' AND filters != '{}'::jsonb THEN
    SELECT string_agg(format('%I = %L', key, filters->key), ' AND ') 
    INTO where_clause
    FROM jsonb_each_text(filters);
    
    IF where_clause IS NOT NULL THEN 
      where_clause := 'WHERE ' || where_clause;
    END IF;
  END IF;

  IF jsonb_typeof(order_by) = 'array' AND jsonb_array_length(order_by) > 0 THEN
    SELECT string_agg(
      format('%I %s', item->>'column', 
        CASE WHEN (item->>'ascending')::boolean THEN 'ASC' ELSE 'DESC' END),
      ', '
    ) INTO order_clause
    FROM jsonb_array_elements(order_by) AS item;
    
    IF order_clause IS NOT NULL THEN 
      order_clause := 'ORDER BY ' || order_clause;
    END IF;
  END IF;

  IF limit_count IS NOT NULL THEN 
    limit_clause := format('LIMIT %s', limit_count);
  END IF;

  query_text := format(
    'SELECT DISTINCT %I as value FROM %I %s %s %s',
    column_name,
    table_name,
    where_clause,
    order_clause,
    limit_clause
  );

  RETURN QUERY EXECUTE format('SELECT to_jsonb(value) FROM (%s) t', query_text);
END;
$$;

GRANT EXECUTE ON FUNCTION get_unique_values TO authenticated;