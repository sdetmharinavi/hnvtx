-- path: data/migrations/06_utilities/20_cascade_data_syncs.sql
-- Description: Adds automated triggers to ensure text fields and physical records stay perfectly synchronized when related entities are edited in forms.

-- ============================================================================
-- 1. CASCADE SERVICE RENAME TO LOGICAL PATHS
-- If a user renames a Service, this ensures all associated Logical Paths update.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.cascade_service_name_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only trigger if the name actually changed
    IF OLD.name IS DISTINCT FROM NEW.name THEN
        
        -- A. Update exact matches in the logical_paths configuration table
        UPDATE public.logical_paths
        SET 
            name = NEW.name, 
            updated_at = NOW()
        WHERE name = OLD.name;

        -- B. Update logical_fiber_paths
        -- These usually have suffixes like " (Working)" or " (Protection)".
        -- Using REPLACE safely swaps the old service name for the new one without touching the suffix.
        UPDATE public.logical_fiber_paths
        SET 
            path_name = REPLACE(path_name, OLD.name, NEW.name), 
            updated_at = NOW()
        WHERE path_name LIKE '%' || OLD.name || '%';
        
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cascade_service_name_update ON public.services;
CREATE TRIGGER trg_cascade_service_name_update
AFTER UPDATE OF name ON public.services
FOR EACH ROW
EXECUTE FUNCTION public.cascade_service_name_update();


-- ============================================================================
-- 2. AUTO-GENERATE FIBERS ON CABLE CAPACITY INCREASE
-- If a user edits a cable and increases it from 24F to 48F, generate the 24 new fibers automatically.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_cable_capacity_increase()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    i INT;
BEGIN
    -- Only trigger if capacity was actively increased
    IF NEW.capacity > OLD.capacity THEN
        FOR i IN (OLD.capacity + 1)..NEW.capacity LOOP
            INSERT INTO public.ofc_connections (
                ofc_id, 
                fiber_no_sn, 
                fiber_no_en, 
                updated_fiber_no_sn, 
                updated_fiber_no_en, 
                updated_sn_id, 
                updated_en_id, 
                fiber_role
            ) VALUES (
                NEW.id, 
                i, i, i, i, 
                NEW.sn_id, NEW.en_id, 
                'working'
            ) ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cable_capacity_increase ON public.ofc_cables;
CREATE TRIGGER trg_cable_capacity_increase
AFTER UPDATE OF capacity ON public.ofc_cables
FOR EACH ROW
EXECUTE FUNCTION public.handle_cable_capacity_increase();


-- ============================================================================
-- 3. SYNC CABLE ENDPOINTS TO UNPROVISIONED FIBERS
-- If a user realizes they selected the wrong Start/End node for a Cable and fixes it in the edit form,
-- this cascades that correction to all fibers that haven't been routed yet.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.sync_cable_nodes_to_connections()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- If Start Node changed
    IF NEW.sn_id IS DISTINCT FROM OLD.sn_id THEN
        UPDATE public.ofc_connections 
        SET updated_sn_id = NEW.sn_id, updated_at = NOW()
        -- Only update fibers that belong to this cable, still point to the old node, AND aren't assigned to a system yet
        WHERE ofc_id = NEW.id AND updated_sn_id = OLD.sn_id AND system_id IS NULL;
    END IF;
    
    -- If End Node changed
    IF NEW.en_id IS DISTINCT FROM OLD.en_id THEN
        UPDATE public.ofc_connections 
        SET updated_en_id = NEW.en_id, updated_at = NOW()
        WHERE ofc_id = NEW.id AND updated_en_id = OLD.en_id AND system_id IS NULL;
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_cable_nodes_to_connections ON public.ofc_cables;
CREATE TRIGGER trg_sync_cable_nodes_to_connections
AFTER UPDATE OF sn_id, en_id ON public.ofc_cables
FOR EACH ROW
EXECUTE FUNCTION public.sync_cable_nodes_to_connections();