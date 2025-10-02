-- path: data/migrations/06_utilities/01_generic_functions.sql
-- Description: A collection of generic, reusable utility functions for querying, pagination, and data manipulation.

-- =================================================================
-- Section 1: Generic Query & Data Operation Functions [CORRECTED]
-- =================================================================

-- Function: execute_sql
-- Executes a read-only SQL query and returns the result as JSON.
DROP FUNCTION IF EXISTS public.execute_sql(TEXT);
CREATE OR REPLACE FUNCTION public.execute_sql(sql_query TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  cleaned_query TEXT;
  result_json JSON;
BEGIN
  -- **RECOMMENDATION: Use a regex to ensure the query is read-only.**
  -- This checks if the trimmed query starts with 'select', 'with', or 'call' (case-insensitive).
  cleaned_query := trim(lower(sql_query));
  IF cleaned_query !~ '^(select|with|call)\s' THEN
    RAISE EXCEPTION 'Only read-only statements (SELECT, WITH, CALL) are allowed.';
  END IF;

  EXECUTE 'SELECT json_agg(t) FROM (' || sql_query || ') t' INTO result_json;
  RETURN json_build_object('result', COALESCE(result_json, '[]'::json));
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('error', SQLERRM);
END;
$$;
GRANT EXECUTE ON FUNCTION public.execute_sql(TEXT) TO authenticated;


-- Function: aggregate_query
-- Performs dynamic aggregations (COUNT, SUM, AVG, etc.) on a table.
CREATE OR REPLACE FUNCTION public.aggregate_query(
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
  -- Build aggregation parts (COUNT, SUM, AVG, etc.)
  -- ... (this part of the function remains unchanged)
  IF (aggregation_options->>'count')::boolean THEN agg_parts := array_append(agg_parts, 'COUNT(*) as count');
  ELSIF aggregation_options->'count' IS NOT NULL THEN agg_parts := array_append(agg_parts, format('COUNT(%I) as count', aggregation_options->>'count')); END IF;
  IF aggregation_options->'sum' IS NOT NULL THEN SELECT array_cat(agg_parts, array_agg(format('SUM(%I) as sum_%s', value, value))) INTO agg_parts FROM jsonb_array_elements_text(aggregation_options->'sum') AS value; END IF;
  IF aggregation_options->'avg' IS NOT NULL THEN SELECT array_cat(agg_parts, array_agg(format('AVG(%I) as avg_%s', value, value))) INTO agg_parts FROM jsonb_array_elements_text(aggregation_options->'avg') AS value; END IF;
  IF aggregation_options->'min' IS NOT NULL THEN SELECT array_cat(agg_parts, array_agg(format('MIN(%I) as min_%s', value, value))) INTO agg_parts FROM jsonb_array_elements_text(aggregation_options->'min') AS value; END IF;
  IF aggregation_options->'max' IS NOT NULL THEN SELECT array_cat(agg_parts, array_agg(format('MAX(%I) as max_%s', value, value))) INTO agg_parts FROM jsonb_array_elements_text(aggregation_options->'max') AS value; END IF;

  -- Build GROUP BY
  -- ... (this part of the function remains unchanged)
  IF aggregation_options->'groupBy' IS NOT NULL THEN
    SELECT string_agg(format('%I', value), ', ') INTO group_clause FROM jsonb_array_elements_text(aggregation_options->'groupBy') AS value;
    SELECT string_agg(format('%I', value), ', ') INTO select_clause FROM jsonb_array_elements_text(aggregation_options->'groupBy') AS value;
    group_clause := 'GROUP BY ' || group_clause;
  END IF;

  IF select_clause != '' AND array_length(agg_parts, 1) > 0 THEN select_clause := select_clause || ', ' || array_to_string(agg_parts, ', ');
  ELSIF array_length(agg_parts, 1) > 0 THEN select_clause := array_to_string(agg_parts, ', ');
  ELSE select_clause := '*'; END IF;

  -- START OF FIX --
  -- Build WHERE clause by calling the robust helper function.
  -- We pass an empty string '' as the alias.
  where_clause := public.build_where_clause(filters, '');
  
  -- The helper function returns a string with a leading ' AND ...', so we strip it if it exists.
  -- We also add the 'WHERE' keyword.
  IF where_clause != '' THEN
    where_clause := 'WHERE ' || substr(where_clause, 6); -- substr(..., 6) removes the leading ' AND '
  END IF;
  -- END OF FIX --

  -- Build ORDER BY
  -- ... (this part of the function remains unchanged)
  IF jsonb_typeof(order_by) = 'array' AND jsonb_array_length(order_by) > 0 THEN
    SELECT string_agg(format('%I %s', item->>'column', CASE WHEN (item->>'ascending')::boolean THEN 'ASC' ELSE 'DESC' END), ', ') INTO order_clause FROM jsonb_array_elements(order_by) AS item;
    IF order_clause IS NOT NULL THEN order_clause := 'ORDER BY ' || order_clause; END IF;
  END IF;

  query_text := format('SELECT %s FROM %I %s %s %s', select_clause, table_name, where_clause, group_clause, order_clause);
  RETURN QUERY EXECUTE format('SELECT row_to_json(t)::jsonb FROM (%s) t', query_text);
END;
$$;
GRANT EXECUTE ON FUNCTION public.aggregate_query(TEXT, JSONB, JSONB, JSONB) TO authenticated;


-- Function: get_unique_values
-- Gets distinct values from a specified column, with optional filtering.
CREATE OR REPLACE FUNCTION public.get_unique_values(
    p_table_name TEXT,
    p_column_name TEXT,
    p_filters JSONB DEFAULT '{}'::jsonb,
    p_order_by JSONB DEFAULT '[]'::jsonb,
    p_limit_count INTEGER DEFAULT NULL
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
    IF jsonb_typeof(p_filters) = 'object' AND p_filters != '{}'::jsonb THEN
        SELECT string_agg(format('%I = %L', key, p_filters->>key), ' AND ')
        INTO where_clause FROM jsonb_object_keys(p_filters) key;
        IF where_clause IS NOT NULL THEN where_clause := 'WHERE ' || where_clause; END IF;
    END IF;
    IF jsonb_typeof(p_order_by) = 'array' AND jsonb_array_length(p_order_by) > 0 THEN
        SELECT string_agg(
            format('%I %s', item->>'column', CASE WHEN (item->>'ascending')::boolean THEN 'ASC' ELSE 'DESC' END), ', '
        ) INTO order_clause FROM jsonb_array_elements(p_order_by) AS item;
        IF order_clause IS NOT NULL THEN order_clause := 'ORDER BY ' || order_clause; END IF;
    END IF;
    IF p_limit_count IS NOT NULL THEN
        limit_clause := format('LIMIT %s', p_limit_count);
    END IF;
    query_text := format('SELECT DISTINCT %I as value FROM %I %s %s %s', p_column_name, p_table_name, where_clause, order_clause, limit_clause);
    RETURN QUERY EXECUTE format('SELECT to_jsonb(t.value) FROM (%s) t', query_text);
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_unique_values(TEXT, TEXT, JSONB, JSONB, INTEGER) TO authenticated;


-- Function: bulk_update
-- Performs bulk updates on a table from a JSONB array of updates.
CREATE OR REPLACE FUNCTION public.bulk_update(
    p_table_name TEXT,
    p_updates JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  update_item JSONB;
  set_clause TEXT;
  query_text TEXT;
  updated_count INTEGER := 0;
  current_updated_count INTEGER;
BEGIN
  FOR update_item IN SELECT * FROM jsonb_array_elements(p_updates) LOOP
    SELECT string_agg(format('%I = %L', key, value), ', ')
    INTO set_clause
    FROM jsonb_each_text(update_item->'data');

    IF set_clause IS NOT NULL THEN
      query_text := format('UPDATE public.%I SET %s, updated_at = NOW() WHERE id = %L',
        p_table_name, set_clause, update_item->>'id');
      EXECUTE query_text;
      GET DIAGNOSTICS current_updated_count = ROW_COUNT;
      updated_count := updated_count + current_updated_count;
    END IF;
  END LOOP;
  RETURN jsonb_build_object('updated_count', updated_count);
END;
$$;
GRANT EXECUTE ON FUNCTION public.bulk_update(TEXT, JSONB) TO authenticated;


-- =================================================================
-- Section 2: Lookup and Enumeration Functions
-- =================================================================

-- Securely get the ID of a lookup type by its category and name.
CREATE OR REPLACE FUNCTION public.get_lookup_type_id(p_category TEXT, p_name TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_type_id UUID;
BEGIN
  SELECT id INTO v_type_id FROM public.lookup_types
  WHERE category = p_category AND name = p_name AND status = true;
  IF v_type_id IS NULL THEN
    RAISE EXCEPTION 'Lookup type not found for category=% and name=%', p_category, p_name;
  END IF;
  RETURN v_type_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_lookup_type_id(TEXT, TEXT) TO authenticated;


-- Add a new lookup type entry.
CREATE OR REPLACE FUNCTION public.add_lookup_type(
  p_category TEXT, p_name TEXT, p_code TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL, p_sort_order INTEGER DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_type_id UUID;
BEGIN
  INSERT INTO public.lookup_types (category, name, code, description, sort_order)
  VALUES (p_category, p_name, p_code, p_description, p_sort_order)
  RETURNING id INTO v_type_id;
  RETURN v_type_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.add_lookup_type(TEXT, TEXT, TEXT, TEXT, INTEGER) TO authenticated;


-- Get all active lookup types for a given category.
CREATE OR REPLACE FUNCTION public.get_lookup_types_by_category(p_category TEXT)
RETURNS TABLE (id UUID, name TEXT, code TEXT, description TEXT, sort_order INTEGER)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT lt.id, lt.name, lt.code, lt.description, lt.sort_order
  FROM public.lookup_types lt
  WHERE lt.category = p_category AND lt.status = true
  ORDER BY lt.sort_order, lt.name;
$$;
GRANT EXECUTE ON FUNCTION public.get_lookup_types_by_category(TEXT) TO authenticated;

-- Generic function to get total, active, and inactive counts for any table/view.
CREATE OR REPLACE FUNCTION public.get_entity_counts(
    p_entity_name TEXT,
    p_filters JSONB DEFAULT '{}'
)
RETURNS TABLE (total_count BIGINT, active_count BIGINT, inactive_count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    sql_query TEXT;
    sql_where TEXT := 'WHERE 1=1';
    filter_key TEXT;
    filter_value JSONB;
BEGIN
    IF p_filters IS NOT NULL AND jsonb_typeof(p_filters) = 'object' AND p_filters != '{}'::jsonb THEN
        FOR filter_key, filter_value IN SELECT * FROM jsonb_each(p_filters)
        LOOP
            sql_where := sql_where || format(' AND %I = %L', filter_key, trim(both '"' from filter_value::text));
        END LOOP;
    END IF;

    sql_query := format(
        'SELECT count(*), count(*) FILTER (WHERE status = true), count(*) FILTER (WHERE status = false) FROM %I %s',
        p_entity_name, sql_where
    );
    RETURN QUERY EXECUTE sql_query;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_entity_counts(TEXT, JSONB) TO authenticated;