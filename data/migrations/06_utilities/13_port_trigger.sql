-- path: data/migrations/06_utilities/18_fix_port_trigger_bidirectional.sql
-- Description: Updates the port utilization trigger to handle BOTH ends of a connection (Source and Destination).

-- CREATE OR REPLACE FUNCTION public.fn_update_port_utilization()
-- RETURNS TRIGGER AS $$
-- DECLARE
--     v_count integer;
-- BEGIN
--     -- ========================================================================
--     -- PART 1: CLEANUP OLD VALUES (Source & Destination)
--     -- Runs on DELETE, or on UPDATE (to clear previous ports)
--     -- ========================================================================
--     IF (TG_OP = 'DELETE') OR (TG_OP = 'UPDATE') THEN
        
--         -- A. Clean Source Side (system_id)
--         IF OLD.system_working_interface IS NOT NULL THEN
--             SELECT COUNT(*) INTO v_count FROM public.system_connections 
--             WHERE system_id = OLD.system_id AND system_working_interface = OLD.system_working_interface;

--             UPDATE public.ports_management
--             SET services_count = v_count, port_utilization = (v_count > 0)
--             WHERE system_id = OLD.system_id AND port = OLD.system_working_interface;
--         END IF;

--         -- B. Clean Destination Side (en_id) - ONLY if it refers to a System in our DB
--         IF OLD.en_id IS NOT NULL AND OLD.en_interface IS NOT NULL THEN
--             -- Check if en_id is actually a system (optimization: check ports table existence)
--             IF EXISTS (SELECT 1 FROM public.ports_management WHERE system_id = OLD.en_id AND port = OLD.en_interface) THEN
--                 -- Count connections where this system is the Destination OR the Source using this port
--                 SELECT COUNT(*) INTO v_count FROM public.system_connections 
--                 WHERE (en_id = OLD.en_id AND en_interface = OLD.en_interface)
--                    OR (system_id = OLD.en_id AND system_working_interface = OLD.en_interface);

--                 UPDATE public.ports_management
--                 SET services_count = v_count, port_utilization = (v_count > 0)
--                 WHERE system_id = OLD.en_id AND port = OLD.en_interface;
--             END IF;
--         END IF;
--     END IF;

--     -- ========================================================================
--     -- PART 2: APPLY NEW VALUES (Source & Destination)
--     -- Runs on INSERT, or on UPDATE
--     -- ========================================================================
--     IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE') THEN
        
--         -- A. Update Source Side
--         IF NEW.system_working_interface IS NOT NULL THEN
--             SELECT COUNT(*) INTO v_count FROM public.system_connections 
--             WHERE system_id = NEW.system_id AND system_working_interface = NEW.system_working_interface;

--             UPDATE public.ports_management
--             SET 
--                 services_count = v_count,
--                 port_utilization = (v_count > 0),
--                 port_admin_status = CASE WHEN v_count > 0 THEN true ELSE port_admin_status END
--             WHERE system_id = NEW.system_id AND port = NEW.system_working_interface;
--         END IF;

--         -- B. Update Destination Side
--         IF NEW.en_id IS NOT NULL AND NEW.en_interface IS NOT NULL THEN
--             IF EXISTS (SELECT 1 FROM public.ports_management WHERE system_id = NEW.en_id AND port = NEW.en_interface) THEN
                
--                 SELECT COUNT(*) INTO v_count FROM public.system_connections 
--                 WHERE (en_id = NEW.en_id AND en_interface = NEW.en_interface)
--                    OR (system_id = NEW.en_id AND system_working_interface = NEW.en_interface);

--                 UPDATE public.ports_management
--                 SET 
--                     services_count = v_count,
--                     port_utilization = (v_count > 0),
--                     port_admin_status = CASE WHEN v_count > 0 THEN true ELSE port_admin_status END
--                 WHERE system_id = NEW.en_id AND port = NEW.en_interface;
--             END IF;
--         END IF;
--     END IF;

--     RETURN NULL;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- -- Re-attach Trigger
-- DROP TRIGGER IF EXISTS trg_update_port_utilization ON public.system_connections;
-- CREATE TRIGGER trg_update_port_utilization
-- AFTER INSERT OR UPDATE OR DELETE ON public.system_connections
-- FOR EACH ROW
-- EXECUTE FUNCTION public.fn_update_port_utilization();

-- path: data/migrations/06_utilities/19_fix_port_utilization_comprehensive.sql
-- Description: Completely rewrites port utilization logic to handle ALL interface types (Working/Protection) on both Source and Destination.

-- 1. Helper Function: Recalculate a single port's status
CREATE OR REPLACE FUNCTION public.recalculate_port_utilization(p_system_id UUID, p_port_name TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    IF p_system_id IS NULL OR p_port_name IS NULL THEN
        RETURN;
    END IF;

    -- Count ALL occurrences of this port in system_connections
    -- It matches if the system matches the ID AND the port matches any of the 4 interface columns appropriate for that side
    SELECT COUNT(*) INTO v_count
    FROM public.system_connections sc
    WHERE
       -- Case 1: System is the Source
       (sc.system_id = p_system_id AND (
            sc.system_working_interface = p_port_name OR
            sc.system_protection_interface = p_port_name
       ))
       OR
       -- Case 2: System is the Destination
       (sc.en_id = p_system_id AND (
            sc.en_interface = p_port_name OR
            sc.en_protection_interface = p_port_name
       ));

    -- Update the port record
    -- We only update if the port actually exists in the management table
    UPDATE public.ports_management
    SET
        services_count = v_count,
        port_utilization = (v_count > 0),
        -- Optional: Auto-set admin status to UP if used, otherwise leave it alone
        port_admin_status = CASE WHEN v_count > 0 THEN true ELSE port_admin_status END,
        updated_at = NOW()
    WHERE system_id = p_system_id AND port = p_port_name;

END;
$$;

-- 2. Trigger Function: orchestrates updates for all touched ports
CREATE OR REPLACE FUNCTION public.fn_update_port_utilization()
RETURNS TRIGGER AS $$
BEGIN
    -- ========================================================================
    -- PART 1: Handle OLD values (DELETE or UPDATE) - Decrement/Recalc
    -- ========================================================================
    IF (TG_OP = 'DELETE') OR (TG_OP = 'UPDATE') THEN
        -- Source Side
        PERFORM public.recalculate_port_utilization(OLD.system_id, OLD.system_working_interface);
        PERFORM public.recalculate_port_utilization(OLD.system_id, OLD.system_protection_interface);

        -- Destination Side
        PERFORM public.recalculate_port_utilization(OLD.en_id, OLD.en_interface);
        PERFORM public.recalculate_port_utilization(OLD.en_id, OLD.en_protection_interface);
    END IF;

    -- ========================================================================
    -- PART 2: Handle NEW values (INSERT or UPDATE) - Increment/Recalc
    -- ========================================================================
    IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE') THEN
        -- Source Side
        PERFORM public.recalculate_port_utilization(NEW.system_id, NEW.system_working_interface);
        PERFORM public.recalculate_port_utilization(NEW.system_id, NEW.system_protection_interface);

        -- Destination Side
        PERFORM public.recalculate_port_utilization(NEW.en_id, NEW.en_interface);
        PERFORM public.recalculate_port_utilization(NEW.en_id, NEW.en_protection_interface);
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-attach Trigger
DROP TRIGGER IF EXISTS trg_update_port_utilization ON public.system_connections;
CREATE TRIGGER trg_update_port_utilization
AFTER INSERT OR UPDATE OR DELETE ON public.system_connections
FOR EACH ROW
EXECUTE FUNCTION public.fn_update_port_utilization();

-- 4. ONE-TIME CLEANUP: Recalculate EVERYTHING to fix existing data inconsistencies
-- This iterates through all ports that currently exist and ensures their status matches the connections table.
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT system_id, port FROM public.ports_management LOOP
        PERFORM public.recalculate_port_utilization(r.system_id, r.port);
    END LOOP;
END;
$$;