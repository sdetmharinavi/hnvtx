-- update_updated_at_column function with secure search_path
create or replace function update_updated_at_column() RETURNS TRIGGER SECURITY DEFINER
set search_path = public, pg_catalog
LANGUAGE plpgsql as $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;