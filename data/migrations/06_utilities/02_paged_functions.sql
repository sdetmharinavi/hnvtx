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