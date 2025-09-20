-- =================================================================
-- FINAL PERMISSIONS SCRIPT FOR ROUTE MANAGER
-- This script aligns with the existing security model by granting
-- permissions to specific roles, not the general 'authenticated' role.
-- =================================================================

-- Step 1: Grant Table-Level Permissions to Specific Roles

-- The 'admin' role gets full control over the new tables.
GRANT ALL ON public.junction_closures TO admin;
GRANT ALL ON public.fiber_splices TO admin;

-- The 'viewer' role needs SELECT permission on the new tables AND any tables joined by the RPC functions.
-- This is the critical step that was missing.
GRANT SELECT ON public.junction_closures TO viewer;
GRANT SELECT ON public.fiber_splices TO viewer;
GRANT SELECT ON public.ofc_cables TO viewer;
GRANT SELECT ON public.nodes TO viewer;
GRANT SELECT ON public.logical_fiber_paths TO viewer;


-- Step 2: Ensure Correct RLS Policies Are In Place for Specific Roles
-- This is idempotent and will replace any previous, incorrect policies for these tables.

-- RLS for `junction_closures`
DROP POLICY IF EXISTS "policy_admin_all_junction_closures" ON public.junction_closures;
CREATE POLICY "policy_admin_all_junction_closures" ON public.junction_closures
FOR ALL TO admin USING (is_super_admin() OR get_my_role() = 'admin');

DROP POLICY IF EXISTS "policy_viewer_select_junction_closures" ON public.junction_closures;
CREATE POLICY "policy_viewer_select_junction_closures" ON public.junction_closures
FOR SELECT TO viewer USING (get_my_role() = 'viewer');

-- RLS for `fiber_splices`
DROP POLICY IF EXISTS "policy_admin_all_fiber_splices" ON public.fiber_splices;
CREATE POLICY "policy_admin_all_fiber_splices" ON public.fiber_splices
FOR ALL TO admin USING (is_super_admin() OR get_my_role() = 'admin');

DROP POLICY IF EXISTS "policy_viewer_select_fiber_splices" ON public.fiber_splices;
CREATE POLICY "policy_viewer_select_fiber_splices" ON public.fiber_splices
FOR SELECT TO viewer USING (get_my_role() = 'viewer');


-- Step 3: Grant EXECUTE on the functions to the 'authenticated' role
-- This allows any logged-in user to CALL the function. The security inside the function
-- and the RLS policies on the tables will then determine if the action is allowed.
GRANT EXECUTE ON FUNCTION public.get_jc_splicing_details(p_jc_id UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.manage_splice(p_action TEXT, p_jc_id UUID, p_splice_id UUID, p_incoming_cable_id UUID, p_incoming_fiber_no INT, p_outgoing_cable_id UUID, p_outgoing_fiber_no INT, p_splice_type TEXT) TO authenticated;


-- Final confirmation
SELECT 'Final, targeted permissions for Route Manager have been applied successfully.' as status;