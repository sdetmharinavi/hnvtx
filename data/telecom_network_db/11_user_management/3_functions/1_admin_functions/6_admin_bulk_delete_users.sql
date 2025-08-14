-- Function to bulk delete users (admin only)
CREATE OR REPLACE FUNCTION public.admin_bulk_delete_users (
    user_ids uuid[]
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$ 
BEGIN 
    -- Check if user is super admin
    IF NOT public.is_super_admin() THEN 
        RAISE EXCEPTION 'Access denied. Super admin privileges required.';
    END IF;
    
    -- Delete from user_profiles (CASCADE will handle auth.users)
    DELETE FROM public.user_profiles
    WHERE id = ANY(user_ids);
    
    RETURN FOUND;
END;
$$;