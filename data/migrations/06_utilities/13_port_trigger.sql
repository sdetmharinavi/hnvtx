CREATE OR REPLACE FUNCTION public.update_port_metrics_trigger()
RETURNS TRIGGER AS $$
DECLARE
  affected_system_id UUID;
  affected_port TEXT;
BEGIN
  -- ============================================================
  -- HANDLE NEW/UPDATED RECORD
  -- ============================================================
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.system_working_interface IS NOT NULL THEN
      affected_system_id := NEW.system_id;
      affected_port := NEW.system_working_interface;
      
      -- Update metrics for this specific port
      UPDATE public.ports_management
      SET 
          -- 1. Count specific services (Must have Customer Name & be Active)
          services_count = (
              SELECT COUNT(*) 
              FROM public.system_connections 
              WHERE system_id = affected_system_id 
                AND system_working_interface = affected_port
                AND status = true
                AND customer_name IS NOT NULL 
                AND TRIM(customer_name) <> ''
          ),
          
          -- 2. Set Utilization (True if count > 0)
          port_utilization = (
              SELECT EXISTS (
                  SELECT 1 
                  FROM public.system_connections 
                  WHERE system_id = affected_system_id 
                    AND system_working_interface = affected_port
                    AND status = true
                    AND customer_name IS NOT NULL 
                    AND TRIM(customer_name) <> ''
              )
          ),
          
          -- 3. Set Admin Status (UP if utilized, otherwise keep existing)
          port_admin_status = CASE 
              WHEN (
                  SELECT COUNT(*) 
                  FROM public.system_connections 
                  WHERE system_id = affected_system_id 
                    AND system_working_interface = affected_port 
                    AND status = true
                    AND customer_name IS NOT NULL 
                    AND TRIM(customer_name) <> ''
              ) > 0 THEN true 
              ELSE port_admin_status 
          END
      WHERE system_id = affected_system_id 
        AND port = affected_port;
  END IF;

  -- ============================================================
  -- HANDLE DELETED/CHANGED RECORD (Cleanup old port)
  -- ============================================================
  IF (TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.system_working_interface IS DISTINCT FROM NEW.system_working_interface)) AND OLD.system_working_interface IS NOT NULL THEN
      affected_system_id := OLD.system_id;
      affected_port := OLD.system_working_interface;

      UPDATE public.ports_management
      SET 
          services_count = (
              SELECT COUNT(*) 
              FROM public.system_connections 
              WHERE system_id = affected_system_id 
                AND system_working_interface = affected_port
                AND status = true
                AND customer_name IS NOT NULL 
                AND TRIM(customer_name) <> ''
          ),
          port_utilization = (
              SELECT EXISTS (
                  SELECT 1 
                  FROM public.system_connections 
                  WHERE system_id = affected_system_id 
                    AND system_working_interface = affected_port
                    AND status = true
                    AND customer_name IS NOT NULL 
                    AND TRIM(customer_name) <> ''
              )
          )
      WHERE system_id = affected_system_id 
        AND port = affected_port;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;