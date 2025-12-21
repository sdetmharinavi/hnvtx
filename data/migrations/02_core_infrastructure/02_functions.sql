-- Path: migrations/02_core_infrastructure/02_functions.sql
-- Description: Contains helper and trigger functions for core tables.

-- Generic function to update the 'updated_at' column on any table.
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- -- Trigger function to update sn_dom (start node date of measurement) if OTDR distance changes significantly.
-- CREATE OR REPLACE FUNCTION public.update_sn_dom_on_otdr_change()
-- RETURNS TRIGGER
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- SET search_path = public, pg_catalog
-- AS $$
-- BEGIN
--   IF NEW.otdr_distance_sn_km IS DISTINCT FROM OLD.otdr_distance_sn_km THEN
--     IF NEW.sn_dom IS NULL OR abs(coalesce(NEW.otdr_distance_sn_km, 0) - coalesce(OLD.otdr_distance_sn_km, 0)) > 0.05 THEN
--       NEW.sn_dom := CURRENT_DATE;
--     END IF;
--   END IF;
--   RETURN NEW;
-- END;
-- $$;

-- -- Trigger function to update en_dom (end node date of measurement) if OTDR distance changes significantly.
-- CREATE OR REPLACE FUNCTION public.update_en_dom_on_otdr_change()
-- RETURNS TRIGGER
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- SET search_path = public, pg_catalog
-- AS $$
-- BEGIN
--   IF NEW.otdr_distance_en_km IS DISTINCT FROM OLD.otdr_distance_en_km THEN
--     IF NEW.en_dom IS NULL OR abs(coalesce(NEW.otdr_distance_en_km, 0) - coalesce(OLD.otdr_distance_en_km, 0)) > 0.05 THEN
--       NEW.en_dom := CURRENT_DATE;
--     END IF;
--   END IF;
--   RETURN NEW;
-- END;
-- $$;