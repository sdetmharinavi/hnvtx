-- path: migrations/05_auditing/04_rls_and_grants.sql
-- Description: Secures the user_activity_logs table, allowing access only to top-level admins. [REVISED FOR ADMIN_PRO]

-- =================================================================
-- Section 1: Grants
-- =================================================================

-- [CHANGED] Grant table-level permissions to both 'admin' and 'admin_pro' roles.
-- No other roles should have any grants on this table.
GRANT ALL ON TABLE public.user_activity_logs TO admin, admin_pro;

-- Grant access to the related view.
GRANT SELECT ON TABLE public.v_audit_logs TO admin, admin_pro;


-- =================================================================
-- Section 2: RLS Policies for user_activity_logs TABLE
-- =================================================================

-- Enable Row Level Security on the log table
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for idempotency
DROP POLICY IF EXISTS "Allow full access to admins" ON public.user_activity_logs;

-- [CHANGED] Create a single policy granting full access (SELECT, INSERT, UPDATE, DELETE)
-- only to users who are super_admins or have the 'admin' or 'admin_pro' role.
CREATE POLICY "Allow full access to admins"
ON public.user_activity_logs
FOR ALL
TO admin, admin_pro -- Apply policy to both roles
USING (is_super_admin() OR get_my_role() IN ('admin', 'admin_pro'))
WITH CHECK (is_super_admin() OR get_my_role() IN ('admin', 'admin_pro'));