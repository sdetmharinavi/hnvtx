-- update_ea_dom_on_otdr_change function with secure search_path
create or replace function update_ea_dom_on_otdr_change() RETURNS TRIGGER SECURITY DEFINER
set search_path = public, pg_catalog
LANGUAGE plpgsql as $$
BEGIN
  IF NEW.otdr_distance_ea_km IS DISTINCT FROM OLD.otdr_distance_ea_km THEN
    IF NEW.ea_dom IS NULL OR abs(coalesce(NEW.otdr_distance_ea_km, 0) - coalesce(OLD.otdr_distance_ea_km, 0)) > 0.05 THEN
      NEW.ea_dom := CURRENT_DATE;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- update_eb_dom_on_otdr_change function with secure search_path
create or replace function update_eb_dom_on_otdr_change() RETURNS TRIGGER SECURITY DEFINER
set search_path = public, pg_catalog
LANGUAGE plpgsql as $$
BEGIN
  IF NEW.otdr_distance_eb_km IS DISTINCT FROM OLD.otdr_distance_eb_km THEN
    IF NEW.eb_dom IS NULL OR abs(coalesce(NEW.otdr_distance_eb_km, 0) - coalesce(OLD.otdr_distance_eb_km, 0)) > 0.05 THEN
      NEW.eb_dom := CURRENT_DATE;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;