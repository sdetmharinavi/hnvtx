-- path: data/migrations/06_utilities/02_paged_functions.sql
-- =================================================================
-- Generic Pagination Functions
-- =================================================================
-- These functions build dynamic SQL. They are constructed to be secure
-- using format() with %I for identifiers and %L for literals.

-- ** The helper functions (column_exists, build_where_clause) have been moved to 01_generic_functions.sql to resolve dependency errors.**
-- THE FIX: Added an optional 'row_limit' parameter for compatibility with hooks
-- that send this parameter name by default. The function prioritizes p_limit.
CREATE OR REPLACE FUNCTION public.get_paged_data(
    p_view_name TEXT, 
    p_limit INT, 
    p_offset INT, 
    p_order_by TEXT DEFAULT 'name',
    p_order_dir TEXT DEFAULT 'asc', 
    p_filters JSONB DEFAULT '{}',
    row_limit INT DEFAULT NULL -- Added for compatibility
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    data_query TEXT; 
    count_query TEXT; 
    where_clause TEXT; 
    order_by_column TEXT;
    result_data JSONB; 
    total_records BIGINT; 
    active_records BIGINT := 0; 
    inactive_records BIGINT := 0;
    status_column_exists BOOLEAN;
    effective_limit INT;
BEGIN
    -- Use p_limit if provided, otherwise fall back to row_limit
    effective_limit := COALESCE(p_limit, row_limit, 1000);

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
        'SELECT jsonb_agg(v) FROM (SELECT * FROM public.%I v %s ORDER BY v.%I %s LIMIT %L OFFSET %L) v',
        p_view_name, where_clause, order_by_column, p_order_dir, effective_limit, p_offset
    );

    IF status_column_exists THEN
        count_query := format(
            'SELECT count(*), count(*) FILTER (WHERE v.status = true), count(*) FILTER (WHERE v.status = false)
             FROM public.%I v %s', p_view_name, where_clause
        );
        EXECUTE count_query INTO total_records, active_records, inactive_records;
    ELSE
        count_query := format('SELECT count(*) FROM public.%I v %s', p_view_name, where_clause);
        EXECUTE count_query INTO total_records;
    END IF;

    EXECUTE data_query INTO result_data;

    RETURN jsonb_build_object(
        'data', COALESCE(result_data, '[]'::jsonb), 'total_count', COALESCE(total_records, 0),
        'active_count', COALESCE(active_records, 0), 'inactive_count', COALESCE(inactive_records, 0)
    );
END;
$$;

-- THE FIX: Update the GRANT statement to include the new optional parameter.
GRANT EXECUTE ON FUNCTION public.get_paged_data(TEXT, INT, INT, TEXT, TEXT, JSONB, INT) TO authenticated;