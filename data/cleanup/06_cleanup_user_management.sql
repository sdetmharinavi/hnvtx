-- path: data/cleanup/06_cleanup_user_management.sql
-- Description: Drops all objects related to the User Management module. [UPDATED]

-- Drop Views
DROP VIEW IF EXISTS public.v_user_profiles_extended;

-- Drop Functions
DROP FUNCTION IF EXISTS public.is_super_admin();
DROP FUNCTION IF EXISTS public.get_my_role();
DROP FUNCTION IF EXISTS public.get_my_user_details();
DROP FUNCTION IF EXISTS public.admin_get_all_users_extended(TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.admin_get_user_by_id(UUID);
DROP FUNCTION IF EXISTS public.admin_update_user_profile(UUID, TEXT, TEXT, TEXT, TEXT, DATE, JSONB, JSONB, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.admin_bulk_update_status(UUID[], TEXT);
DROP FUNCTION IF EXISTS public.admin_bulk_update_role(UUID[], TEXT);
DROP FUNCTION IF EXISTS public.admin_bulk_delete_users(UUID[]);
DROP FUNCTION IF EXISTS public.update_user_profile_timestamp();
DROP FUNCTION IF EXISTS public.sync_user_role_to_auth();
DROP FUNCTION IF EXISTS public.create_public_profile_for_new_user();

-- Drop Table
DROP TABLE IF EXISTS public.user_profiles CASCADE;