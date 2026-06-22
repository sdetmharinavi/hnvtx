-- path: data/migrations/10_power_readings/02_fix_power_readings_permissions.sql
-- Description: [FIXED] Grants table-level and view-level permissions on port_power_readings to all roles and sets a permissive policy.

-- 1. Grant permissions to public (which includes sdh_admin, mng_admin, cpan_admin, etc.)
GRANT ALL ON TABLE public.port_power_readings TO public;
GRANT SELECT ON TABLE public.v_port_power_readings TO public;

-- 2. Enable RLS
ALTER TABLE public.port_power_readings ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Allow full access to authenticated users on port_power_readings" ON public.port_power_readings;
DROP POLICY IF EXISTS "Allow full access to all users on port_power_readings" ON public.port_power_readings;

-- 4. Create a single, inclusive policy for public access
CREATE POLICY "Allow full access to all users on port_power_readings"
ON public.port_power_readings
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- 5. Safeguard for audit logs: Allow all roles to insert into user_activity_logs (required for triggers)
GRANT INSERT ON TABLE public.user_activity_logs TO public;

DROP POLICY IF EXISTS "Allow insert for all authenticated" ON public.user_activity_logs;
DROP POLICY IF EXISTS "Allow insert for all" ON public.user_activity_logs;

CREATE POLICY "Allow insert for all"
ON public.user_activity_logs
FOR INSERT
TO public
WITH CHECK (true);