-- Grants for utility functions
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_user_details() TO authenticated;

-- Grants for admin functions
GRANT EXECUTE ON FUNCTION public.admin_get_all_users(
    text, text, text, timestamptz, timestamptz, integer, integer
) TO authenticated;

GRANT EXECUTE ON FUNCTION public.admin_get_user_by_id(uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION public.admin_update_user_profile(
    uuid, text, text, text, text, date, jsonb, jsonb, text, text, text
) TO authenticated;

GRANT EXECUTE ON FUNCTION public.admin_bulk_update_status(uuid[], text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_bulk_update_role(uuid[], text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_bulk_delete_users(uuid[]) TO authenticated;

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Grant Table Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profiles TO admin;
GRANT SELECT ON public.user_profiles TO viewer;