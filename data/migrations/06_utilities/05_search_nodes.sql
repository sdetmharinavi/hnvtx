-- path: migrations/06_utilities/07_search_nodes.sql
-- Description: Creates a function to search nodes for dropdowns with pagination and filtering.

CREATE OR REPLACE FUNCTION public.search_nodes_for_select(
    p_search_term TEXT DEFAULT '',
    p_limit INT DEFAULT 20
)
RETURNS TABLE (id UUID, name TEXT)
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT n.id, n.name
    FROM public.v_nodes_complete n
    WHERE n.status = true
      AND (
        p_search_term = '' OR
        n.name ILIKE ('%' || p_search_term || '%')
      )
    ORDER BY n.name
    LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_nodes_for_select(TEXT, INT) TO authenticated;