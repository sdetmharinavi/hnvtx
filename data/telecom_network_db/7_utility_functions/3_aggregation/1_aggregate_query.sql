-- Function: aggregate_query
CREATE OR REPLACE FUNCTION aggregate_query(
    table_name TEXT,
    aggregation_options JSONB,
    filters JSONB DEFAULT '{}'::jsonb,
    order_by JSONB DEFAULT '[]'::jsonb
) 
RETURNS TABLE(result JSONB) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp 
AS $$
DECLARE 
  query_text TEXT;
  select_clause TEXT := '';
  where_clause TEXT := '';
  group_clause TEXT := '';
  order_clause TEXT := '';
  agg_parts TEXT[] := ARRAY[]::TEXT[];
BEGIN 
  -- COUNT
  IF (aggregation_options->>'count')::boolean THEN 
    agg_parts := array_append(agg_parts, 'COUNT(*) as count');
  ELSIF aggregation_options->'count' IS NOT NULL THEN 
    agg_parts := array_append(agg_parts, format('COUNT(%I) as count', aggregation_options->>'count'));
  END IF;
  
  -- SUM
  IF aggregation_options->'sum' IS NOT NULL THEN
    SELECT array_cat(agg_parts, array_agg(format('SUM(%I) as sum_%s', value, value)))
    INTO agg_parts
    FROM jsonb_array_elements_text(aggregation_options->'sum') AS value;
  END IF;
  
  -- AVG
  IF aggregation_options->'avg' IS NOT NULL THEN
    SELECT array_cat(agg_parts, array_agg(format('AVG(%I) as avg_%s', value, value)))
    INTO agg_parts
    FROM jsonb_array_elements_text(aggregation_options->'avg') AS value;
  END IF;
  
  -- MIN
  IF aggregation_options->'min' IS NOT NULL THEN
    SELECT array_cat(agg_parts, array_agg(format('MIN(%I) as min_%s', value, value)))
    INTO agg_parts
    FROM jsonb_array_elements_text(aggregation_options->'min') AS value;
  END IF;
  
  -- MAX
  IF aggregation_options->'max' IS NOT NULL THEN
    SELECT array_cat(agg_parts, array_agg(format('MAX(%I) as max_%s', value, value)))
    INTO agg_parts
    FROM jsonb_array_elements_text(aggregation_options->'max') AS value;
  END IF;
  
  -- GROUP BY
  IF aggregation_options->'groupBy' IS NOT NULL THEN
    SELECT string_agg(format('%I', value), ', ') INTO group_clause
    FROM jsonb_array_elements_text(aggregation_options->'groupBy') AS value;
    
    SELECT string_agg(format('%I', value), ', ') INTO select_clause
    FROM jsonb_array_elements_text(aggregation_options->'groupBy') AS value;
    
    group_clause := 'GROUP BY ' || group_clause;
  END IF;
  
  IF select_clause != '' AND array_length(agg_parts, 1) > 0 THEN 
    select_clause := select_clause || ', ' || array_to_string(agg_parts, ', ');
  ELSIF array_length(agg_parts, 1) > 0 THEN 
    select_clause := array_to_string(agg_parts, ', ');
  ELSE 
    select_clause := '*';
  END IF;
  
  -- WHERE
  IF jsonb_typeof(filters) = 'object' AND filters != '{}'::jsonb THEN
    SELECT string_agg(format('%I = %L', key, filters->key), ' AND ') 
    INTO where_clause
    FROM jsonb_each_text(filters);
    
    IF where_clause IS NOT NULL THEN 
      where_clause := 'WHERE ' || where_clause;
    END IF;
  END IF;
  
  -- ORDER BY
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
  
  query_text := format(
    'SELECT %s FROM %I %s %s %s',
    select_clause,
    table_name,
    where_clause,
    group_clause,
    order_clause
  );
  
  RETURN QUERY EXECUTE format('SELECT row_to_json(t)::jsonb FROM (%s) t', query_text);
END;
$$;

GRANT EXECUTE ON FUNCTION aggregate_query TO authenticated;