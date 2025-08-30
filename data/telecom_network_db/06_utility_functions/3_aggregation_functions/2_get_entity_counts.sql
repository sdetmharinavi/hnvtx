-- Function: get_entity_counts
-- Description: A generic function to get total, active, and inactive counts for any table/view.
-- It's ideal for dashboards and KPIs where only aggregate numbers are needed.

CREATE OR REPLACE FUNCTION get_entity_counts(
    p_entity_name TEXT,
    p_filters JSONB DEFAULT '{}'
)
RETURNS TABLE (
    total_count BIGINT,
    active_count BIGINT,
    inactive_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    sql_query TEXT;
    sql_where TEXT := 'WHERE 1=1';
    filter_key TEXT;
    filter_value JSONB;
BEGIN
    -- Build WHERE clause from simple filters (assumes status column exists for active/inactive)
    IF p_filters IS NOT NULL AND jsonb_typeof(p_filters) = 'object' AND p_filters != '{}'::jsonb THEN
        FOR filter_key, filter_value IN SELECT * FROM jsonb_each(p_filters)
        LOOP
            sql_where := sql_where || format(' AND %I = %L', filter_key, trim(both '"' from filter_value::text));
        END LOOP;
    END IF;

    -- Construct the final aggregation query
    sql_query := format(
        'SELECT ' ||
        'count(*), ' ||
        'count(*) FILTER (WHERE status = true), ' ||
        'count(*) FILTER (WHERE status = false) ' ||
        'FROM %I ' || -- Use %I for the entity (table/view) name
        '%s', -- The WHERE clause
        p_entity_name,
        sql_where
    );

    -- Execute the query
    RETURN QUERY EXECUTE sql_query;
END;
$$;

GRANT EXECUTE ON FUNCTION get_entity_counts(TEXT, JSONB) TO authenticated;