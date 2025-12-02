CREATE OR REPLACE FUNCTION public.fn_update_port_utilization()
RETURNS TRIGGER AS $$
DECLARE
    v_count integer;
BEGIN
    -- ========================================================================
    -- LOGIC FOR OLD PORT (Cleanup)
    -- Runs on DELETE, or on UPDATE if the port assignment changed
    -- ========================================================================
    IF (TG_OP = 'DELETE') OR (TG_OP = 'UPDATE' AND OLD.system_working_interface IS DISTINCT FROM NEW.system_working_interface) THEN
        
        IF OLD.system_working_interface IS NOT NULL THEN
            -- 1. Count active services remaining on the OLD port
            SELECT COUNT(*) INTO v_count
            FROM public.system_connections
            WHERE system_id = OLD.system_id
              AND system_working_interface = OLD.system_working_interface
              -- FIX: Use service_id instead of removed customer_name
              AND service_id IS NOT NULL;

            -- 2. Update the OLD port status in ports_management
            UPDATE public.ports_management
            SET 
                services_count = v_count,
                port_utilization = (v_count > 0)
            WHERE system_id = OLD.system_id 
              AND port = OLD.system_working_interface;
        END IF;
    END IF;

    -- ========================================================================
    -- LOGIC FOR NEW PORT (Allocation)
    -- Runs on INSERT, or on UPDATE (to ensure the new target is marked used)
    -- ========================================================================
    IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE') THEN
        
        IF NEW.system_working_interface IS NOT NULL THEN
            -- 1. Count active services on the NEW port
            SELECT COUNT(*) INTO v_count
            FROM public.system_connections
            WHERE system_id = NEW.system_id
              AND system_working_interface = NEW.system_working_interface
              -- FIX: Use service_id instead of removed customer_name
              AND service_id IS NOT NULL;

            -- 2. Update the NEW port status in ports_management
            UPDATE public.ports_management
            SET 
                services_count = v_count,
                port_utilization = (v_count > 0),
                -- Business Rule: If we plug a service into a port, force Admin Status to UP
                port_admin_status = CASE 
                    WHEN v_count > 0 THEN true 
                    ELSE port_admin_status 
                END
            WHERE system_id = NEW.system_id 
              AND port = NEW.system_working_interface;
        END IF;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-attach the trigger
DROP TRIGGER IF EXISTS trg_update_port_utilization ON public.system_connections;
CREATE TRIGGER trg_update_port_utilization
AFTER INSERT OR UPDATE OR DELETE ON public.system_connections
FOR EACH ROW
EXECUTE FUNCTION public.fn_update_port_utilization();