-- path: data/migrations/06_utilities/18_fix_port_trigger_bidirectional.sql
-- Description: Updates the port utilization trigger to handle BOTH ends of a connection (Source and Destination).

CREATE OR REPLACE FUNCTION public.fn_update_port_utilization()
RETURNS TRIGGER AS $$
DECLARE
    v_count integer;
BEGIN
    -- ========================================================================
    -- PART 1: CLEANUP OLD VALUES (Source & Destination)
    -- Runs on DELETE, or on UPDATE (to clear previous ports)
    -- ========================================================================
    IF (TG_OP = 'DELETE') OR (TG_OP = 'UPDATE') THEN
        
        -- A. Clean Source Side (system_id)
        IF OLD.system_working_interface IS NOT NULL THEN
            SELECT COUNT(*) INTO v_count FROM public.system_connections 
            WHERE system_id = OLD.system_id AND system_working_interface = OLD.system_working_interface;

            UPDATE public.ports_management
            SET services_count = v_count, port_utilization = (v_count > 0)
            WHERE system_id = OLD.system_id AND port = OLD.system_working_interface;
        END IF;

        -- B. Clean Destination Side (en_id) - ONLY if it refers to a System in our DB
        IF OLD.en_id IS NOT NULL AND OLD.en_interface IS NOT NULL THEN
            -- Check if en_id is actually a system (optimization: check ports table existence)
            IF EXISTS (SELECT 1 FROM public.ports_management WHERE system_id = OLD.en_id AND port = OLD.en_interface) THEN
                -- Count connections where this system is the Destination OR the Source using this port
                SELECT COUNT(*) INTO v_count FROM public.system_connections 
                WHERE (en_id = OLD.en_id AND en_interface = OLD.en_interface)
                   OR (system_id = OLD.en_id AND system_working_interface = OLD.en_interface);

                UPDATE public.ports_management
                SET services_count = v_count, port_utilization = (v_count > 0)
                WHERE system_id = OLD.en_id AND port = OLD.en_interface;
            END IF;
        END IF;
    END IF;

    -- ========================================================================
    -- PART 2: APPLY NEW VALUES (Source & Destination)
    -- Runs on INSERT, or on UPDATE
    -- ========================================================================
    IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE') THEN
        
        -- A. Update Source Side
        IF NEW.system_working_interface IS NOT NULL THEN
            SELECT COUNT(*) INTO v_count FROM public.system_connections 
            WHERE system_id = NEW.system_id AND system_working_interface = NEW.system_working_interface;

            UPDATE public.ports_management
            SET 
                services_count = v_count,
                port_utilization = (v_count > 0),
                port_admin_status = CASE WHEN v_count > 0 THEN true ELSE port_admin_status END
            WHERE system_id = NEW.system_id AND port = NEW.system_working_interface;
        END IF;

        -- B. Update Destination Side
        IF NEW.en_id IS NOT NULL AND NEW.en_interface IS NOT NULL THEN
            IF EXISTS (SELECT 1 FROM public.ports_management WHERE system_id = NEW.en_id AND port = NEW.en_interface) THEN
                
                SELECT COUNT(*) INTO v_count FROM public.system_connections 
                WHERE (en_id = NEW.en_id AND en_interface = NEW.en_interface)
                   OR (system_id = NEW.en_id AND system_working_interface = NEW.en_interface);

                UPDATE public.ports_management
                SET 
                    services_count = v_count,
                    port_utilization = (v_count > 0),
                    port_admin_status = CASE WHEN v_count > 0 THEN true ELSE port_admin_status END
                WHERE system_id = NEW.en_id AND port = NEW.en_interface;
            END IF;
        END IF;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach Trigger
DROP TRIGGER IF EXISTS trg_update_port_utilization ON public.system_connections;
CREATE TRIGGER trg_update_port_utilization
AFTER INSERT OR UPDATE OR DELETE ON public.system_connections
FOR EACH ROW
EXECUTE FUNCTION public.fn_update_port_utilization();