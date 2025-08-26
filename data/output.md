<!-- path: /home/au/Desktop/git_projects/newhnvtx/hnvtx/data/telecom_network_db/06_utility_functions/4_pagination_functions/7_get_paged_maintenance_areas_with_count.sql -->
```sql
-- Function: get_paged_maintenance_areas_with_count
DROP FUNCTION IF EXISTS public.get_paged_maintenance_areas_with_count;
CREATE OR REPLACE FUNCTION public.get_paged_maintenance_areas_with_count(
    p_limit integer,
    p_offset integer,
    p_order_by text DEFAULT 'name',
    p_order_dir text DEFAULT 'asc',
    p_filters jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(
    id text,
    name text,
    code text,
    area_type_id text,
    parent_id text,
    contact_person text,
    contact_number text,
    email text,
    latitude numeric,
    longitude numeric,
    address text,
    status boolean,
    created_at text,
    updated_at text,
    maintenance_area_type_name text,
    maintenance_area_type_code text,
    maintenance_area_type_category text,
    maintenance_area_type_sort_order integer,
    maintenance_area_type_is_system_default boolean,
    maintenance_area_type_status boolean,
    maintenance_area_type_created_at text,
    maintenance_area_type_updated_at text,
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
      ma.id::text,
      ma.name::text,
      ma.code::text,
      ma.area_type_id::text,
      ma.parent_id::text,
      ma.contact_person::text,
      ma.contact_number::text,
      ma.email::text,
      ma.latitude::numeric,
      ma.longitude::numeric,
      ma.address::text,
      ma.status::boolean,
      ma.created_at::text,
      ma.updated_at::text,
      ma.maintenance_area_type_name::text,
      ma.maintenance_area_type_code::text,
      ma.maintenance_area_type_category::text,
      ma.maintenance_area_type_sort_order::integer,
      ma.maintenance_area_type_is_system_default::boolean,
      ma.maintenance_area_type_status::boolean,
      ma.maintenance_area_type_created_at::text,
      ma.maintenance_area_type_updated_at::text,
      count(*) OVER() AS total_count,
      sum(CASE WHEN ma.status THEN 1 ELSE 0 END) OVER() AS active_count,
      sum(CASE WHEN NOT ma.status THEN 1 ELSE 0 END) OVER() AS inactive_count
    FROM public.v_maintenance_areas_with_count ma
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

GRANT EXECUTE ON FUNCTION public.get_paged_maintenance_areas_with_count(integer, integer, text, text, jsonb) TO authenticated;
ALTER FUNCTION public.get_paged_maintenance_areas_with_count(integer, integer, text, text, jsonb)
SET search_path = public, auth, pg_temp;
```

<!-- path: /home/au/Desktop/git_projects/newhnvtx/hnvtx/data/telecom_network_db/06_utility_functions/4_pagination_functions/4_paged_systems_complete.sql -->
```sql
-- Function: get_paged_v_systems_complete
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
    maan_area text,
    maan_ring_no text,
    maintenance_area_name text,
    node_ip inet,
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
    total_count bigint
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
        where_clause := where_clause || format(
          ' AND %I::text ILIKE %L',
          filter_key,
          '%' || trim(filter_value::text, '"') || '%'
        );
      END IF;
    END LOOP;
  END IF;

  sql_query := format(
    $query$
    SELECT 
      v.commissioned_on::text,
      v.created_at::text,
      v.id::text,
      v.ip_address,
      v.latitude::numeric,
      v.longitude::numeric,
      v.maan_area,
      v.maan_ring_no,
      v.maintenance_area_name,
      v.node_ip,
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
      count(*) OVER() AS total_count
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
```

<!-- path: /home/au/Desktop/git_projects/newhnvtx/hnvtx/data/telecom_network_db/06_utility_functions/4_pagination_functions/10_get_paged_rings_with_count.sql -->
```sql
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
```

<!-- path: /home/au/Desktop/git_projects/newhnvtx/hnvtx/data/telecom_network_db/06_utility_functions/4_pagination_functions/9_get_paged_employees_with_count.sql -->
```sql
-- Function: get_paged_employees_with_count
DROP FUNCTION IF EXISTS public.get_paged_employees_with_count;
CREATE OR REPLACE FUNCTION public.get_paged_employees_with_count(
    p_limit integer,
    p_offset integer,
    p_order_by text DEFAULT 'employee_name',
    p_order_dir text DEFAULT 'asc',
    p_filters jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(
    id text,
    employee_name text,
    employee_pers_no text,
    employee_contact text,
    employee_email text,
    employee_dob date,
    employee_doj date,
    employee_designation_id text,
    employee_addr text,
    maintenance_terminal_id text,
    remark text,
    status boolean,
    created_at text,
    updated_at text,
    employee_designation_name text,
    employee_designation_code text,
    employee_designation_category text,
    employee_designation_sort_order integer,
    employee_designation_is_system_default boolean,
    employee_designation_status boolean,
    employee_designation_created_at text,
    employee_designation_updated_at text,
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
      e.id::text,
      e.employee_name::text,
      e.employee_pers_no::text,
      e.employee_contact::text,
      e.employee_email::text,
      e.employee_dob::date,
      e.employee_doj::date,
      e.employee_designation_id::text,
      e.employee_addr::text,
      e.maintenance_terminal_id::text,
      e.remark::text,
      e.status::boolean,
      e.created_at::text,
      e.updated_at::text,
      e.employee_designation_name::text,
      e.employee_designation_code::text,
      e.employee_designation_category::text,
      e.employee_designation_sort_order::integer,
      e.employee_designation_is_system_default::boolean,
      e.employee_designation_status::boolean,
      e.employee_designation_created_at::text,
      e.employee_designation_updated_at::text,
      count(*) OVER() AS total_count,
      sum(CASE WHEN e.status THEN 1 ELSE 0 END) OVER() AS active_count,
      sum(CASE WHEN NOT e.status THEN 1 ELSE 0 END) OVER() AS inactive_count
    FROM public.v_employees_with_count e
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

GRANT EXECUTE ON FUNCTION public.get_paged_employees_with_count(integer, integer, text, text, jsonb) TO authenticated;
ALTER FUNCTION public.get_paged_employees_with_count(integer, integer, text, text, jsonb)
SET search_path = public, auth, pg_temp;
```

<!-- path: /home/au/Desktop/git_projects/newhnvtx/hnvtx/data/telecom_network_db/06_utility_functions/4_pagination_functions/1_paged_nodes_complete.sql -->
```sql
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
      count(*) OVER() AS total_count,
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
```

<!-- path: /home/au/Desktop/git_projects/newhnvtx/hnvtx/data/telecom_network_db/06_utility_functions/4_pagination_functions/5_paged_system_connections_complete.sql -->
```sql
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
```

<!-- path: /home/au/Desktop/git_projects/newhnvtx/hnvtx/data/telecom_network_db/06_utility_functions/4_pagination_functions/8_get_paged_employee_designations_with_count.sql -->
```sql
-- Function: get_paged_employee_designations_with_count
DROP FUNCTION IF EXISTS public.get_paged_employee_designations_with_count;
CREATE OR REPLACE FUNCTION public.get_paged_employee_designations_with_count(
    p_limit integer,
    p_offset integer,
    p_order_by text DEFAULT 'name',
    p_order_dir text DEFAULT 'asc',
    p_filters jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(
    id text,
    name text,
    parent_id text,
    status boolean,
    created_at text,
    updated_at text,
    employee_designation_name text,
    employee_designation_code text,
    employee_designation_category text,
    employee_designation_sort_order integer,
    employee_designation_is_system_default boolean,
    employee_designation_status boolean,
    employee_designation_created_at text,
    employee_designation_updated_at text,
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
      ed.id::text,
      ed.name::text,
      ed.parent_id::text,
      ed.status::boolean,
      ed.created_at::text,
      ed.updated_at::text,
      ed.employee_designation_name::text,
      ed.employee_designation_code::text,
      ed.employee_designation_category::text,
      ed.employee_designation_sort_order::integer,
      ed.employee_designation_is_system_default::boolean,
      ed.employee_designation_status::boolean,
      ed.employee_designation_created_at::text,
      ed.employee_designation_updated_at::text,
      count(*) OVER() AS total_count,
      sum(CASE WHEN ed.status THEN 1 ELSE 0 END) OVER() AS active_count,
      sum(CASE WHEN NOT ed.status THEN 1 ELSE 0 END) OVER() AS inactive_count
    FROM public.v_employee_designations_with_count ed
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

GRANT EXECUTE ON FUNCTION public.get_paged_employee_designations_with_count(integer, integer, text, text, jsonb) TO authenticated;
ALTER FUNCTION public.get_paged_employee_designations_with_count(integer, integer, text, text, jsonb)
SET search_path = public, auth, pg_temp;
```

<!-- path: /home/au/Desktop/git_projects/newhnvtx/hnvtx/data/telecom_network_db/06_utility_functions/4_pagination_functions/6_get_paged_lookup_types_with_count.sql -->
```sql
-- Function: get_paged_lookup_types_with_count
DROP FUNCTION IF EXISTS public.get_paged_lookup_types_with_count;
CREATE OR REPLACE FUNCTION public.get_paged_lookup_types_with_count(
    p_limit integer,
    p_offset integer,
    p_order_by text DEFAULT 'name',
    p_order_dir text DEFAULT 'asc',
    p_filters jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(
    id text,
    category text,
    name text,
    code text,
    description text,
    sort_order integer,
    is_system_default boolean,
    status boolean,
    created_at text,
    updated_at text,
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
      lt.id::text,
      lt.category::text,
      lt.name::text,
      lt.code::text,
      lt.description::text,
      lt.sort_order::integer,
      lt.is_system_default::boolean,
      lt.status::boolean,
      lt.created_at::text,
      lt.updated_at::text,
      count(*) OVER() AS total_count,
      sum(CASE WHEN lt.status THEN 1 ELSE 0 END) OVER() AS active_count,
      sum(CASE WHEN NOT lt.status THEN 1 ELSE 0 END) OVER() AS inactive_count
    FROM public.v_lookup_types_with_count lt
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

GRANT EXECUTE ON FUNCTION public.get_paged_lookup_types_with_count(integer, integer, text, text, jsonb) TO authenticated;
ALTER FUNCTION public.get_paged_lookup_types_with_count(integer, integer, text, text, jsonb)
SET search_path = public, auth, pg_temp;
```

<!-- path: /home/au/Desktop/git_projects/newhnvtx/hnvtx/data/telecom_network_db/06_utility_functions/4_pagination_functions/2_paged_ofc_cables_complete.sql -->
```sql
-- Function: get_paged_ofc_cables_complete
DROP FUNCTION IF EXISTS public.get_paged_ofc_cables_complete;
CREATE OR REPLACE FUNCTION public.get_paged_ofc_cables_complete(
    p_limit integer,
    p_offset integer,
    p_order_by text DEFAULT 'route_name',
    p_order_dir text DEFAULT 'asc',
    p_filters jsonb DEFAULT '{}'::jsonb
) 
RETURNS TABLE(
    id text,
    asset_no text,
    route_name text,
    sn_id text,
    en_id text,
    capacity integer,
    ofc_owner_code text,
    ofc_owner_id text,
    ofc_owner_name text,
    commissioned_on text,
    created_at text,
    current_rkm numeric,
    maintenance_area_code text,
    maintenance_area_name text,
    maintenance_terminal_id text,
    ofc_type_code text,
    ofc_type_id text,
    ofc_type_name text,
    remark text,
    status boolean,
    transnet_id text,
    transnet_rkm numeric,
    updated_at text,
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
      v.id::text,
      v.asset_no::text,
      v.route_name::text,
      v.sn_id::text,
      v.en_id::text,
      v.capacity,
      v.ofc_owner_code::text,
      v.ofc_owner_id::text,
      v.ofc_owner_name::text,
      v.commissioned_on::text,
      v.created_at::text,
      v.current_rkm,
      v.maintenance_area_code::text,
      v.maintenance_area_name::text,
      v.maintenance_terminal_id::text,
      v.ofc_type_code::text,
      v.ofc_type_id::text,
      v.ofc_type_name::text,
      v.remark::text,
      v.status,
      v.transnet_id::text,
      v.transnet_rkm,
      v.updated_at::text,
      count(*) OVER() AS total_count,
      sum(CASE WHEN v.status THEN 1 ELSE 0 END) OVER() AS active_count,
      sum(CASE WHEN NOT v.status THEN 1 ELSE 0 END) OVER() AS inactive_count
    FROM public.v_ofc_cables_complete v
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

GRANT EXECUTE ON FUNCTION public.get_paged_ofc_cables_complete(integer, integer, text, text, jsonb) TO authenticated;
ALTER FUNCTION public.get_paged_ofc_cables_complete(integer, integer, text, text, jsonb)
SET search_path = public, auth, pg_temp;
```

<!-- path: /home/au/Desktop/git_projects/newhnvtx/hnvtx/data/telecom_network_db/06_utility_functions/4_pagination_functions/3_paged_ofc_connections_complete.sql -->
```sql
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
    system_name text,
    otdr_distance_sn_km numeric,
    en_id text,
    en_name text,
    en_dom text,
    fiber_no_en integer,
    maintenance_area_name text,
    otdr_distance_en_km numeric,
    status boolean,
    remark text,
    created_at text,
    updated_at text,
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
      -- Replaced with columns from v_ofc_connections_complete
      v.id::text,
      v.ofc_id::text,
      v.ofc_route_name::text,
      v.ofc_type_name::text,
      v.sn_id::text,
      v.sn_name::text,
      v.sn_dom::text,
      v.fiber_no_sn,
      v.system_name::text,
      v.otdr_distance_sn_km,
      v.en_id::text,
      v.en_name::text,
      v.en_dom::text,
      v.fiber_no_en,
      v.maintenance_area_name::text,
      v.otdr_distance_en_km,
      v.status,
      v.remark::text,
      v.created_at::text,
      v.updated_at::text,
      count(*) OVER() AS total_count,
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
```

