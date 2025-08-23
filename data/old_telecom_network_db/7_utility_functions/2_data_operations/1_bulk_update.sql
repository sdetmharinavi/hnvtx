-- Function: bulk_update
CREATE OR REPLACE FUNCTION bulk_update(
    table_name TEXT,
    updates JSONB,
    batch_size INTEGER DEFAULT 1000
) 
RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp 
AS $$
DECLARE 
  update_item JSONB;
  query_text TEXT;
  result_count INTEGER := 0;
  batch_count INTEGER := 0;
BEGIN 
  FOR update_item IN SELECT value FROM jsonb_array_elements(updates) 
  LOOP 
    query_text := format(
      'UPDATE %I SET %s WHERE id = %L RETURNING *',
      table_name,
      (SELECT string_agg(format('%I = %L', key, update_item->'data'->key), ', ')
       FROM jsonb_each_text(update_item->'data')),
      update_item->>'id'
    );
    
    EXECUTE query_text;
    result_count := result_count + 1;
    batch_count := batch_count + 1;
    
    IF batch_count >= batch_size THEN 
      batch_count := 0;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object('updated_count', result_count);
END;
$$;

GRANT EXECUTE ON FUNCTION bulk_update TO authenticated;