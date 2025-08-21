-- get_lookup_type_id function with secure search_path
create or replace function get_lookup_type_id(p_category TEXT, p_name TEXT) 
RETURNS UUID SECURITY DEFINER
set search_path = public, pg_catalog
LANGUAGE plpgsql as $$
DECLARE 
  v_type_id UUID;
BEGIN
  SELECT id INTO v_type_id
  FROM lookup_types
  WHERE category = p_category
    AND name = p_name
    AND status = true;
  
  IF v_type_id IS NULL THEN
    RAISE EXCEPTION 'Lookup type not found: category=%, name=%', p_category, p_name;
  END IF;
  
  RETURN v_type_id;
END;
$$;

-- Function to add_lookup_type function with secure search_path
create or replace function add_lookup_type(
  p_category TEXT,
  p_name TEXT,
  p_code TEXT default null,
  p_description TEXT default null,
  p_sort_order INTEGER default 0
) RETURNS UUID SECURITY DEFINER
set search_path = public, pg_catalog
LANGUAGE plpgsql as $$
DECLARE
  v_type_id UUID;
BEGIN
  INSERT INTO lookup_types (category, name, code, description, sort_order)
  VALUES (p_category, p_name, p_code, p_description, p_sort_order)
  RETURNING id INTO v_type_id;
  
  RETURN v_type_id;
END;
$$;

-- Function to get_lookup_types_by_category function with secure search_path
create or replace function get_lookup_types_by_category(p_category TEXT) 
RETURNS table (
  id UUID,
  name TEXT,
  code TEXT,
  description TEXT,
  sort_order INTEGER
) SECURITY INVOKER
set search_path = public, pg_catalog
LANGUAGE plpgsql as $$
BEGIN
  RETURN QUERY
  SELECT lt.id, lt.name, lt.code, lt.description, lt.sort_order
  FROM lookup_types lt
  WHERE lt.category = p_category
    AND lt.status = true
  ORDER BY lt.sort_order, lt.name;
END;
$$;