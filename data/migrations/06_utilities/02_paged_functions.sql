-- =================================================================
-- Generic Pagination Functions
-- =================================================================
-- These functions build dynamic SQL. They are constructed to be secure
-- using format() with %I for identifiers and %L for literals.

-- Helper function to check if a column exists in a given table/view
CREATE OR REPLACE FUNCTION public.column_exists(p_schema_name TEXT, p_table_name TEXT, p_column_name TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql STABLE AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = p_schema_name
          AND table_name = p_table_name
          AND column_name = p_column_name
    );
END;
$$;

-- Helper function to build the WHERE clause dynamically
CREATE OR REPLACE FUNCTION public.build_where_clause(p_filters JSONB, p_view_name TEXT, p_alias TEXT DEFAULT 'v')
RETURNS TEXT LANGUAGE plpgsql STABLE AS $$
DECLARE
  where_clause TEXT := '';
  filter_key TEXT;
  filter_value JSONB;
  or_conditions TEXT[];
  or_key TEXT;
  or_value TEXT;
  alias_prefix TEXT;
BEGIN
    alias_prefix := CASE WHEN p_alias IS NOT NULL AND p_alias != '' THEN format('%I.', p_alias) ELSE '' END;

    IF p_filters IS NULL OR jsonb_typeof(p_filters) != 'object' THEN
        RETURN '';
    END IF;

    FOR filter_key, filter_value IN SELECT key, value FROM jsonb_each(p_filters) LOOP
        IF filter_value IS NULL OR filter_value = '""'::jsonb THEN CONTINUE; END IF;

        -- SECURE OR CONDITION HANDLING
        IF filter_key = 'or' AND jsonb_typeof(filter_value) = 'object' THEN
            or_conditions := ARRAY[]::TEXT[];
            FOR or_key, or_value IN SELECT key, value FROM jsonb_each_text(filter_value) LOOP
                -- Only add condition if column exists in the view
                IF public.column_exists('public', p_view_name, or_key) THEN
                    -- Use format with %I for identifier and %L for literal to prevent SQL injection
                    or_conditions := array_append(or_conditions, format('%s%I ILIKE %L', alias_prefix, or_key, '%' || or_value || '%'));
                END IF;
            END LOOP;

            IF array_length(or_conditions, 1) > 0 THEN
                where_clause := where_clause || ' AND (' || array_to_string(or_conditions, ' OR ') || ')';
            END IF;
        ELSE
            -- Standard AND condition handling (for other filters)
            IF public.column_exists('public', p_view_name, filter_key) THEN
                IF jsonb_typeof(filter_value) = 'array' THEN
                    where_clause := where_clause || format(' AND %s%I IN (SELECT value::text FROM jsonb_array_elements_text(%L))', alias_prefix, filter_key, filter_value);
                ELSE
                    where_clause := where_clause || format(' AND %s%I::text = %L', alias_prefix, filter_key, filter_value->>0);
                END IF;
            END IF;
        END IF;
    END LOOP;

    RETURN where_clause;
END;
$$;

-- =================================================================
-- Section 2: Generic Pagination Function
-- =================================================================
CREATE OR REPLACE FUNCTION public.get_paged_data(
    p_view_name TEXT, p_limit INT, p_offset INT, p_order_by TEXT DEFAULT 'id',
    p_order_dir TEXT DEFAULT 'asc', p_filters JSONB DEFAULT '{}'
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    data_query TEXT; count_query TEXT; where_clause TEXT; order_by_column TEXT;
    result_data JSONB; total_records BIGINT; active_records BIGINT := 0; inactive_records BIGINT := 0;
    status_column_exists BOOLEAN;
BEGIN
    status_column_exists := public.column_exists('public', p_view_name, 'status');
    where_clause := public.build_where_clause(p_filters, p_view_name);
    IF public.column_exists('public', p_view_name, p_order_by) THEN
        order_by_column := p_order_by;
    ELSE
        IF public.column_exists('public', p_view_name, 'id') THEN
            order_by_column := 'id';
        ELSE
            SELECT column_name INTO order_by_column FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = p_view_name
            ORDER BY ordinal_position LIMIT 1;
        END IF;
    END IF;
    data_query := format(
        'SELECT jsonb_agg(v) FROM (SELECT * FROM public.%I v WHERE 1=1 %s ORDER BY v.%I %s LIMIT %L OFFSET %L) v',
        p_view_name, where_clause, order_by_column, p_order_dir, p_limit, p_offset
    );
    IF status_column_exists THEN
        count_query := format(
            'SELECT count(*), count(*) FILTER (WHERE v.status = true), count(*) FILTER (WHERE v.status = false)
             FROM public.%I v WHERE 1=1 %s', p_view_name, where_clause
        );
        EXECUTE count_query INTO total_records, active_records, inactive_records;
    ELSE
        count_query := format('SELECT count(*) FROM public.%I v WHERE 1=1 %s', p_view_name, where_clause);
        EXECUTE count_query INTO total_records;
    END IF;
    EXECUTE data_query INTO result_data;
    RETURN jsonb_build_object(
        'data', COALESCE(result_data, '[]'::jsonb), 'total_count', COALESCE(total_records, 0),
        'active_count', COALESCE(active_records, 0), 'inactive_count', COALESCE(inactive_records, 0)
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_paged_data(TEXT, INT, INT, TEXT, TEXT, JSONB) TO authenticated;
