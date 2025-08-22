-- Function: get_paged_v_system_connections_complete
-- Corrected name to be consistent with pg standards
DROP FUNCTION IF EXISTS public.get_paged_system_connections_complete;
CREATE OR REPLACE FUNCTION public.get_paged_system_connections_complete(
    p_limit integer,
    p_offset integer,
    p_order_by text DEFAULT 'system_name',
    p_order_dir text DEFAULT 'asc',
    p_filters jsonb DEFAULT '{}'::jsonb
) 
RETURNS TABLE(
    -- Replaced with columns from v_system_connections_complete
    id text,
    system_id text,
    system_name text,
    system_type_name text,
    media_type_name text,
    sn_name text,
    sn_interface text,
    sn_ip text,
    en_name text,
    en_interface text,
    en_ip text,
    connected_system_name text,
    connected_system_type_name text,
    bandwidth_mbps integer,
    vlan text,
    commissioned_on text,
    status boolean,
    remark text,
    created_at text,
    updated_at text,
    sdh_stm_no text,
    sdh_carrier text,
    sdh_a_slot text,
    sdh_a_customer text,
    sdh_b_slot text,
    sdh_b_customer text,
    maan_fiber_in integer,
    maan_fiber_out integer,
    maan_sfp_port text,
    maan_sfp_serial_no text,
    maan_sfp_capacity text,
    maan_sfp_type_name text,
    maan_customer_name text,
    maan_bandwidth_allocated_mbps integer,
    vmux_channel text,
    vmux_subscriber text,
    vmux_c_code text,
    vmux_tk text,
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
      -- Replaced with columns from v_system_connections_complete
      v.id::text,
      v.system_id::text,
      v.system_name::text,
      v.system_type_name::text,
      v.media_type_name::text,
      v.sn_name::text,
      v.sn_interface::text,
      v.sn_ip::text,
      v.en_name::text,
      v.en_interface::text,
      v.en_ip::text,
      v.connected_system_name::text,
      v.connected_system_type_name::text,
      v.bandwidth_mbps,
      v.vlan::text,
      v.commissioned_on::text,
      v.status,
      v.remark::text,
      v.created_at::text,
      v.updated_at::text,
      v.sdh_stm_no::text,
      v.sdh_carrier::text,
      v.sdh_a_slot::text,
      v.sdh_a_customer::text,
      v.sdh_b_slot::text,
      v.sdh_b_customer::text,
      v.maan_fiber_in,
      v.maan_fiber_out,
      v.maan_sfp_port::text,
      v.maan_sfp_serial_no::text,
      v.maan_sfp_capacity::text,
      v.maan_sfp_type_name::text,
      v.maan_customer_name::text,
      v.maan_bandwidth_allocated_mbps,
      v.vmux_channel::text,
      v.vmux_subscriber::text,
      v.vmux_c_code::text,
      v.vmux_tk::text,
      count(*) OVER() AS total_count,
      sum(CASE WHEN v.status THEN 1 ELSE 0 END) OVER() AS active_count,
      sum(CASE WHEN NOT v.status THEN 1 ELSE 0 END) OVER() AS inactive_count
    FROM public.v_system_connections_complete v -- Corrected the view name
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
GRANT EXECUTE ON FUNCTION public.get_paged_system_connections_complete(integer, integer, text, text, jsonb) TO authenticated;
ALTER FUNCTION public.get_paged_system_connections_complete(integer, integer, text, text, jsonb)
SET search_path = public, auth, pg_temp;