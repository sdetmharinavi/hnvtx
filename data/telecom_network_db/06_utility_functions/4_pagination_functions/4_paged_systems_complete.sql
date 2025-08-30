-- REFACTORED: This function is now synchronized with the improved v_systems_complete view.
-- It uses the new, more descriptive column names.

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
    
    -- UPDATED: Changed from 'maan_area' to the new, clearer alias.
    ring_logical_area_name text,
    -- UPDATED: Changed from 'maan_ring_no' to the actual UUID field.
    ring_id text,
    
    -- RENAMED: For clarity and consistency.
    system_maintenance_terminal_name text,
    
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
  -- The filter building logic remains unchanged
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

  -- The main query is updated to select the new column names
  sql_query := format(
    $query$
    SELECT
      v.commissioned_on::text,
      v.created_at::text,
      v.id::text,
      v.ip_address,
      v.latitude::numeric,
      v.longitude::numeric,
      
      -- UPDATED: Selecting the new, correct column names from the view
      v.ring_logical_area_name::text,
      v.ring_id::text,
      v.system_maintenance_terminal_name::text,
      
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
      count(*) OVER() AS total_count,
      sum(CASE WHEN v.status THEN 1 ELSE 0 END) OVER() AS active_count,
      sum(CASE WHEN NOT v.status THEN 1 ELSE 0 END) OVER() AS inactive_count
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