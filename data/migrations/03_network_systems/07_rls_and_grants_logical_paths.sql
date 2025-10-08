-- path: data/migrations/03_network_systems/07_rls_and_grants_logical_paths.sql
-- Description: Defines all RLS policies and Grants for the new logical_paths table.

-- =================================================================
-- Section 1: Enable RLS and Grant Table-Level Permissions
-- =================================================================

-- Enable Row Level Security on the new table
ALTER TABLE public.logical_paths ENABLE ROW LEVEL SECURITY;

-- Grant broad permissions to specific roles. RLS policies will handle the fine-grained access.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.logical_paths TO admin;
GRANT SELECT ON public.logical_paths TO viewer;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.logical_paths TO cpan_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.logical_paths TO maan_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.logical_paths TO sdh_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.logical_paths TO vmux_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.logical_paths TO mng_admin;

-- =================================================================
-- Section 2: RLS Policies for logical_paths
-- =================================================================

-- Drop existing policies for idempotency
DROP POLICY IF EXISTS "Allow admin full access" ON public.logical_paths;
DROP POLICY IF EXISTS "Allow viewers read-only access" ON public.logical_paths;
DROP POLICY IF EXISTS "Allow system admins full access" ON public.logical_paths;


-- Policy 1: Admins and Super-Admins have unrestricted access.
CREATE POLICY "Allow admin full access"
ON public.logical_paths
FOR ALL
TO admin
USING (is_super_admin() OR get_my_role() = 'admin')
WITH CHECK (is_super_admin() OR get_my_role() = 'admin');


-- Policy 2: Viewers can see all logical paths.
CREATE POLICY "Allow viewers read-only access"
ON public.logical_paths
FOR SELECT
TO viewer
USING (true);


-- Policy 3: System-specific admins (cpan_admin, maan_admin, etc.) can manage all paths.
-- Since paths can span different system types, it's simplest to allow all system admins
-- full control over path definitions. The security of individual systems is handled by other policies.
CREATE POLICY "Allow system admins full access"
ON public.logical_paths
FOR ALL
TO cpan_admin, maan_admin, sdh_admin, vmux_admin, mng_admin
USING (get_my_role() IN ('cpan_admin', 'maan_admin', 'sdh_admin', 'vmux_admin', 'mng_admin'))
WITH CHECK (get_my_role() IN ('cpan_admin', 'maan_admin', 'sdh_admin', 'vmux_admin', 'mng_admin'));