-- =============================================================================
-- MASTER DATABASE CLEANUP SCRIPT for telecom_network_db
-- =============================================================================
-- This script is designed to be run to reset the 'public' schema while
-- preserving essential user management objects.
--
-- PRESERVED OBJECTS:
-- - Table: user_profiles
-- - View: v_user_profiles_extended
-- - Functions: is_super_admin, get_my_role, get_my_user_details, 
--              admin_get_all_users_extended, 
--              admin_get_user_by_id, admin_update_user_profile,
--              admin_bulk_update_status, admin_bulk_update_role,
--              admin_bulk_delete_users, update_user_profile_timestamp,
--              sync_user_role_to_auth, create_public_profile_for_new_user
-- - Triggers: on_auth_user_created, update_user_profile_updated_at,
--             sync_user_role_trigger, sync_user_role_insert_trigger
-- - RLS Policies and Grants for user_profiles
-- =============================================================================

DO $$ BEGIN RAISE NOTICE 'Starting database cleanup (preserving user management objects)...';
END $$;

-- -----------------------------------------------------------------------------
-- 1️⃣ Drop All Views in the 'public' schema (except v_user_profiles_extended)
-- -----------------------------------------------------------------------------
DO $$
DECLARE r RECORD;
BEGIN RAISE NOTICE 'Dropping all views (except v_user_profiles_extended)...';
FOR r IN (
    SELECT viewname
    FROM pg_views
    WHERE schemaname = 'public'
    AND viewname != 'v_user_profiles_extended'
) LOOP EXECUTE 'DROP VIEW IF EXISTS public.' || quote_ident(r.viewname) || ' CASCADE;';
RAISE NOTICE 'Dropped view: %',
r.viewname;
END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 2️⃣ Drop All RLS Policies on tables in the 'public' schema 
--    (except those for user_profiles)
-- -----------------------------------------------------------------------------
DO $$
DECLARE r RECORD;
BEGIN RAISE NOTICE 'Dropping all RLS policies (except user_profiles policies)...';
FOR r IN (
    SELECT tablename,
        policyname
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename != 'user_profiles'
) LOOP EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.' || quote_ident(r.tablename) || ';';
RAISE NOTICE 'Dropped policy: % ON %',
r.policyname,
r.tablename;
END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 3️⃣ Drop All Triggers on tables in the 'public' schema
--    (except the specified user management triggers)
-- -----------------------------------------------------------------------------
DO $$
DECLARE r RECORD;
BEGIN RAISE NOTICE 'Dropping all triggers (except user management triggers)...';
FOR r IN (
    SELECT tgname,
        relname
    FROM pg_trigger
        JOIN pg_class ON tgrelid = pg_class.oid
        JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
    WHERE nspname = 'public'
        AND NOT tgisinternal
        AND tgname NOT IN (
            'on_auth_user_created',
            'update_user_profile_updated_at', 
            'sync_user_role_trigger',
            'sync_user_role_insert_trigger'
        )
) LOOP EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.tgname) || ' ON public.' || quote_ident(r.relname) || ' CASCADE;';
RAISE NOTICE 'Dropped trigger: % ON %',
r.tgname,
r.relname;
END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 4️⃣ Drop All Functions in the 'public' schema (except specified functions)
-- -----------------------------------------------------------------------------
DO $$
DECLARE r RECORD;
BEGIN RAISE NOTICE 'Dropping all functions (except user management functions)...';
FOR r IN (
    SELECT p.oid::regprocedure::text as func_signature
    FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
    AND p.proname NOT IN (
        'is_super_admin',
        'get_my_role',
        'get_my_user_details',
        'admin_get_all_users_extended',
        'admin_get_user_by_id',
        'admin_update_user_profile',
        'admin_bulk_update_status',
        'admin_bulk_update_role',
        'admin_bulk_delete_users',
        'update_user_profile_timestamp',
        'sync_user_role_to_auth',
        'create_public_profile_for_new_user'
    )
) LOOP EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE;';
RAISE NOTICE 'Dropped function: %',
r.func_signature;
END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 5️⃣ Drop All Tables in the 'public' schema (except user_profiles)
-- -----------------------------------------------------------------------------
DO $$
DECLARE r RECORD;
BEGIN RAISE NOTICE 'Dropping all tables (except user_profiles)...';
FOR r IN (
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename != 'user_profiles'
) LOOP EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE;';
RAISE NOTICE 'Dropped table: %',
r.tablename;
END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 6️⃣ Verify preserved objects are still intact
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    RAISE NOTICE 'Verifying preserved objects...';
    
    -- Check if user_profiles table exists
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_profiles') THEN
        RAISE NOTICE '✓ user_profiles table preserved';
    ELSE
        RAISE NOTICE '✗ user_profiles table NOT found!';
    END IF;
    
    -- Check if view exists
    IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'v_user_profiles_extended') THEN
        RAISE NOTICE '✓ v_user_profiles_extended view preserved';
    ELSE
        RAISE NOTICE '✗ v_user_profiles_extended view NOT found!';
    END IF;
    
    -- Check if key functions exist
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_super_admin' AND pronamespace = 'public'::regnamespace) THEN
        RAISE NOTICE '✓ is_super_admin function preserved';
    ELSE
        RAISE NOTICE '✗ is_super_admin function NOT found!';
    END IF;
    
    -- Check if triggers exist
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        RAISE NOTICE '✓ on_auth_user_created trigger preserved';
    ELSE
        RAISE NOTICE '✗ on_auth_user_created trigger NOT found!';
    END IF;
    
    RAISE NOTICE 'Preserved objects verification completed.';
END $$;

DO $$ BEGIN RAISE NOTICE 'Database cleanup finished successfully (user management objects preserved).';
END $$;

-- =============================================================================
-- RECREATE RLS POLICIES AND GRANTS for user_profiles
-- =============================================================================
-- Use this script if you need to recreate the RLS policies and grants
-- that were preserved during the cleanup.
-- =============================================================================

DO $$ BEGIN RAISE NOTICE 'Recreating RLS policies and grants for user_profiles...';
END $$;

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
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profiles TO admin;
GRANT SELECT ON public.user_profiles TO viewer;

-- =================================================================
-- Section 2: RLS Policies for user_profiles
-- =================================================================

-- Enable RLS on the table (if not already enabled)
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

DO $$ BEGIN RAISE NOTICE 'RLS policies and grants recreated successfully.';
END $$;