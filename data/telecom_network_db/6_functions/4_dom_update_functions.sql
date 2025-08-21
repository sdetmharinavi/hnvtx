-- update_sn_dom_on_otdr_change function with secure search_path
create or replace function update_sn_dom_on_otdr_change() RETURNS TRIGGER SECURITY DEFINER
set search_path = public, pg_catalog
LANGUAGE plpgsql as $$
BEGIN
  IF NEW.otdr_distance_sn_km IS DISTINCT FROM OLD.otdr_distance_sn_km THEN
    IF NEW.sn_dom IS NULL OR abs(coalesce(NEW.otdr_distance_sn_km, 0) - coalesce(OLD.otdr_distance_sn_km, 0)) > 0.05 THEN
      NEW.sn_dom := CURRENT_DATE;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- update_en_dom_on_otdr_change function with secure search_path
create or replace function update_en_dom_on_otdr_change() RETURNS TRIGGER SECURITY DEFINER
set search_path = public, pg_catalog
LANGUAGE plpgsql as $$
BEGIN
  IF NEW.otdr_distance_en_km IS DISTINCT FROM OLD.otdr_distance_en_km THEN
    IF NEW.en_dom IS NULL OR abs(coalesce(NEW.otdr_distance_en_km, 0) - coalesce(OLD.otdr_distance_en_km, 0)) > 0.05 THEN
      NEW.en_dom := CURRENT_DATE;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;