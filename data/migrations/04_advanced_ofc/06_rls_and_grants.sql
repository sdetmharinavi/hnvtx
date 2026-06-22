-- path: data/migrations/10_power_readings/02_fix_power_readings_permissions.sql
-- Description: [FIXED] Grants read-only access to all roles, and restricts write/delete access to specified admin roles.

-- =================================================================
-- 1. Reset Table-Level Privileges
-- =================================================================

-- Revoke all existing privileges first to ensure a clean state
REVOKE ALL ON TABLE public.port_power_readings FROM public, authenticated, admin, admin_pro, viewer, cpan_admin, maan_admin, sdh_admin, asset_admin, mng_admin;
REVOKE ALL ON TABLE public.v_port_power_readings FROM public, authenticated, admin, admin_pro, viewer, cpan_admin, maan_admin, sdh_admin, asset_admin, mng_admin;

-- Grant SELECT (View) to all roles (both table and view)
GRANT SELECT ON TABLE public.port_power_readings TO admin, admin_pro, ofc_admin, viewer, cpan_admin, maan_admin, sdh_admin, asset_admin, mng_admin, authenticated;
GRANT SELECT ON TABLE public.v_port_power_readings TO admin, admin_pro, ofc_admin, viewer, cpan_admin, maan_admin, sdh_admin, asset_admin, mng_admin, authenticated;

-- Grant INSERT, UPDATE, DELETE (Write/Delete) only to the specified admin roles
GRANT INSERT, UPDATE, DELETE ON TABLE public.port_power_readings TO admin, admin_pro, ofc_admin, cpan_admin, maan_admin, sdh_admin;


-- =================================================================
-- 2. Define RLS Policies for port_power_readings
-- =================================================================

ALTER TABLE public.port_power_readings ENABLE ROW LEVEL SECURITY;

-- Drop old policies to prevent collision
DROP POLICY IF EXISTS "Allow full access to authenticated users on port_power_readings" ON public.port_power_readings;
DROP POLICY IF EXISTS "Allow full access to all users on port_power_readings" ON public.port_power_readings;
DROP POLICY IF EXISTS "policy_select_power_readings" ON public.port_power_readings;
DROP POLICY IF EXISTS "policy_write_power_readings" ON public.port_power_readings;

-- Policy A: View (SELECT) for all authenticated roles
CREATE POLICY "policy_select_power_readings"
ON public.port_power_readings
FOR SELECT
TO public
USING (true);

-- Policy B: Manage (INSERT, UPDATE, DELETE) restricted to specific admin roles
CREATE POLICY "policy_write_power_readings"
ON public.port_power_readings
FOR ALL
TO admin, admin_pro, ofc_admin, cpan_admin, maan_admin, sdh_admin
USING (
  is_super_admin() OR 
  public.get_my_role() IN ('admin', 'admin_pro', 'ofc_admin', 'cpan_admin', 'maan_admin', 'sdh_admin')
)
WITH CHECK (
  is_super_admin() OR 
  public.get_my_role() IN ('admin', 'admin_pro', 'ofc_admin', 'cpan_admin', 'maan_admin', 'sdh_admin')
);


-- =================================================================
-- 3. Audit Log Safeguards
-- =================================================================
-- Ensures that when write-capable roles perform inserts/deletes, 
-- the logging triggers do not fail on inserting into user_activity_logs.

GRANT INSERT ON TABLE public.user_activity_logs TO public;

DROP POLICY IF EXISTS "Allow insert for all authenticated" ON public.user_activity_logs;
DROP POLICY IF EXISTS "Allow insert for all" ON public.user_activity_logs;

CREATE POLICY "Allow insert for all"
ON public.user_activity_logs
FOR INSERT
TO public
WITH CHECK (true);