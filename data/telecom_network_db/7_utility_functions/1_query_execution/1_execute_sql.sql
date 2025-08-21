-- Function: execute_sql
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
  -- Remove leading whitespace and convert to lowercase
  cleaned_query := lower(regexp_replace(sql_query, '^\s*', ''));
  
  -- Allow only SELECT or WITH queries
  IF cleaned_query NOT LIKE 'select %' AND cleaned_query NOT LIKE 'with %' THEN 
    RAISE EXCEPTION 'Only SELECT statements are allowed';
  END IF;
  
  -- Execute query and aggregate result to JSON
  EXECUTE 'SELECT json_agg(t) FROM (' || sql_query || ') t' INTO result_json;
  RETURN json_build_object('result', COALESCE(result_json, '[]'::json));
  
EXCEPTION WHEN OTHERS THEN 
  RETURN json_build_object('error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.execute_sql(TEXT) TO authenticated;