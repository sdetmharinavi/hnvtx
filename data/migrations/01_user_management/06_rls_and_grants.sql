-- Path: migrations/01_user_management/06_rls_and_grants.sql
-- Description: All RLS policies and Grants for the User Management module.

-- =================================================================
-- Section 1: Grants
-- =================================================================

-- Grants for utility functions
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_user_details() TO authenticated;

-- Grants for admin functions
GRANT EXECUTE ON FUNCTION public.admin_get_all_users_extended(text, text, text, text, timestamptz, timestamptz, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_user_by_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_user_profile(uuid, text, text, text, text, date, jsonb, jsonb, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_bulk_update_status(uuid[], text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_bulk_update_role(uuid[], text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_bulk_delete_users(uuid[]) TO authenticated;

-- Grant Table Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profiles TO admin, admin_pro;
GRANT SELECT ON public.user_profiles TO viewer;

-- Grant SELECT on the view to authenticated users
-- The `security_invoker` property on the view ensures RLS policies are applied for each user.
GRANT SELECT ON public.v_user_profiles_extended TO authenticated;


-- =================================================================
-- Section 2: RLS Policies for user_profiles TABLE
-- =================================================================

-- Enable RLS on the table
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for idempotency
DROP POLICY IF EXISTS "Super admins have full access to user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Pro Admins can manage all profiles" ON public.user_profiles;


-- Policy 1: Super admins have unrestricted access (for database maintenance).
CREATE POLICY "Super admins have full access to user_profiles"
ON public.user_profiles
FOR ALL
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- Policy 2: Users can view their own profile.
-- This remains essential for any logged-in user to see their own data.
CREATE POLICY "Users can view their own profile"
ON public.user_profiles
FOR SELECT
USING ((select auth.uid()) = id);

-- Policy 3: Users can update their own profile.
CREATE POLICY "Users can update their own profile"
ON public.user_profiles
FOR UPDATE
USING ((select auth.uid()) = id)
WITH CHECK ((select auth.uid()) = id);

-- Policy 4: Admins and Pro Admins can view all user profiles.
-- This policy fixes the critical gap, allowing admin roles to see all users
-- in the user management dashboard.
CREATE POLICY "Admins can view all profiles"
ON public.user_profiles
FOR SELECT
USING (public.get_my_role() IN ('admin', 'admin_pro'));

-- Policy 5: Pro Admins can manage (insert/update/delete) all profiles.
-- This policy grants the 'admin_pro' role full management capabilities, while
-- preventing a standard 'admin' from performing these actions on other users.
-- This is enforced at the database level, complementing the security in the RPC functions.
CREATE POLICY "Pro Admins can manage all profiles"
ON public.user_profiles
FOR ALL -- Applies to INSERT, UPDATE, DELETE
USING (public.get_my_role() = 'admin_pro')
WITH CHECK (public.get_my_role() = 'admin_pro');