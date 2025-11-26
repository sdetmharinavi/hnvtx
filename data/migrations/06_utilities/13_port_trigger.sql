-- 1. Replace the Function
CREATE OR REPLACE FUNCTION public.fn_update_port_utilization()
RETURNS TRIGGER AS $$
DECLARE
    v_system_id uuid;
    v_port_name text;
    v_service_count integer;
BEGIN
    -- Determine context based on operation
    IF (TG_OP = 'DELETE') THEN
        v_system_id := OLD.system_id;
        v_port_name := OLD.system_working_interface;
    ELSE
        v_system_id := NEW.system_id;
        v_port_name := NEW.system_working_interface;
    END IF;

    -- If interface is null, we can't link to a port, so exit
    IF v_port_name IS NULL THEN
        RETURN NULL;
    END IF;

    -- Calculate active services on this port
    -- Logic: Only count if customer_name is present (NOT NULL and NOT Empty)
    SELECT COUNT(*)
    INTO v_service_count
    FROM public.system_connections
    WHERE system_id = v_system_id
      AND system_working_interface = v_port_name
      AND customer_name IS NOT NULL 
      AND trim(customer_name) <> '';

    -- Update the ports_management table
    UPDATE public.ports_management
    SET 
        services_count = v_service_count,
        
        -- Mark as utilized if services exist
        port_utilization = (v_service_count > 0),
        
        -- THE FIX: Automatically set Admin Status to TRUE if utilized. 
        -- If not utilized, keep the existing admin status (don't force down).
        port_admin_status = CASE 
            WHEN v_service_count > 0 THEN true 
            ELSE port_admin_status 
        END
    WHERE system_id = v_system_id 
      AND port = v_port_name;
      
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Re-attach Trigger (Ensures it is active)
DROP TRIGGER IF EXISTS trg_update_port_utilization ON public.system_connections;

CREATE TRIGGER trg_update_port_utilization
AFTER INSERT OR UPDATE OR DELETE ON public.system_connections
FOR EACH ROW
EXECUTE FUNCTION public.fn_update_port_utilization();