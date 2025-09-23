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
GRANT EXECUTE ON FUNCTION public.admin_get_all_users(text, text, text, timestamptz, timestamptz, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_all_users_extended(text, text, text, text, timestamptz, timestamptz, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_user_by_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_user_profile(uuid, text, text, text, text, date, jsonb, jsonb, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_bulk_update_status(uuid[], text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_bulk_update_role(uuid[], text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_bulk_delete_users(uuid[]) TO authenticated;

-- Grant Table Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profiles TO admin;
GRANT SELECT ON public.user_profiles TO viewer;


-- =================================================================
-- Section 2: RLS Policies for user_profiles
-- =================================================================

-- Enable RLS on the table
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for idempotency
DROP POLICY IF EXISTS "Super admins have full access to user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.user_profiles;

-- Allow super admins full access to all rows
CREATE POLICY "Super admins have full access to user_profiles"
ON public.user_profiles
FOR ALL
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- Allow users to read their own profile
CREATE POLICY "Users can view their own profile"
ON public.user_profiles
FOR SELECT
USING ((select auth.uid()) = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
ON public.user_profiles
FOR UPDATE
USING ((select auth.uid()) = id)
WITH CHECK ((select auth.uid()) = id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile"
ON public.user_profiles
FOR INSERT
WITH CHECK ((select auth.uid()) = id);

-- Allow users to delete their own profile
CREATE POLICY "Users can delete their own profile"
ON public.user_profiles
FOR DELETE
USING ((select auth.uid()) = id);