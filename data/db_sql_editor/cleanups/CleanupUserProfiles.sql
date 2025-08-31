-- 1️⃣ Drop the dependent view first
DROP VIEW IF EXISTS public.user_profile_details CASCADE;

-- 2️⃣ Drop triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_user_profile_updated_at ON public.user_profiles;
DROP TRIGGER IF EXISTS sync_user_role_trigger ON public.user_profiles;
DROP TRIGGER IF EXISTS sync_user_role_insert_trigger ON public.user_profiles;

-- 3️⃣ Drop RLS policies
DROP POLICY IF EXISTS "users_select_own_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "users_insert_own_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "super_admin_delete_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "users_select_own_profile_or_superadmin" ON public.user_profiles;
DROP POLICY IF EXISTS "users_insert_own_profile_or_superadmin" ON public.user_profiles;
DROP POLICY IF EXISTS "users_update_own_profile_or_superadmin" ON public.user_profiles;
DROP POLICY IF EXISTS "allow_own_profile_access_or_superadmin" ON public.user_profiles;

-- 4️⃣ Drop functions (if you no longer need them)
DROP FUNCTION IF EXISTS public.get_my_profile();
DROP FUNCTION IF EXISTS public.update_my_profile(
  TEXT, TEXT, TEXT, TEXT, DATE, JSONB, JSONB
);
DROP FUNCTION IF EXISTS public.get_my_user_details();
DROP FUNCTION IF EXISTS public.is_super_admin();
DROP FUNCTION IF EXISTS public.get_my_role();
DROP FUNCTION IF EXISTS public.admin_get_all_users(
  TEXT, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, INTEGER, INTEGER
);
DROP FUNCTION IF EXISTS public.admin_get_user_by_id(UUID);
DROP FUNCTION IF EXISTS public.admin_update_user_profile(
  UUID, TEXT, TEXT, TEXT, TEXT, DATE, JSONB, JSONB, TEXT, TEXT, TEXT
);
DROP FUNCTION IF EXISTS public.admin_bulk_update_status(UUID[], TEXT);
DROP FUNCTION IF EXISTS public.admin_bulk_update_role(UUID[], TEXT);
DROP FUNCTION IF EXISTS public.admin_bulk_delete_users(UUID[]);
DROP FUNCTION IF EXISTS public.update_user_profile_timestamp();
DROP FUNCTION IF EXISTS public.sync_user_role_to_auth();
DROP FUNCTION IF EXISTS public.create_public_profile_for_new_user();

-- 5️⃣ Drop indexes
DROP INDEX IF EXISTS idx_user_profiles_updated_at;
DROP INDEX IF EXISTS idx_user_profiles_phone;

-- 6️⃣ Finally drop the table
DROP TABLE IF EXISTS public.user_profiles CASCADE;