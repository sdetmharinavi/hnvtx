-- Function to bulk update user role (admin only)
CREATE OR REPLACE FUNCTION public.admin_bulk_update_role (
    user_ids uuid[], 
    new_role text
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$ 
BEGIN 
    -- Check if user is super admin
    IF NOT public.is_super_admin() THEN 
        RAISE EXCEPTION 'Access denied. Super admin privileges required.';
    END IF;
    
    -- Validate role
    IF new_role NOT IN (
        'admin',
        'viewer',
        'cpan_admin',
        'maan_admin',
        'sdh_admin',
        'vmux_admin',
        'mng_admin'
    ) THEN 
        RAISE EXCEPTION 'Invalid role.';
    END IF;
    
    UPDATE public.user_profiles
    SET 
        role = new_role,
        updated_at = NOW()
    WHERE id = ANY(user_ids);

    -- Log this bulk action
    PERFORM public.log_user_activity(
        'BULK_UPDATE_ROLE',
        'user_profiles',
        NULL,
        jsonb_build_object('user_ids', user_ids),
        jsonb_build_object('new_role', new_role),
        'Bulk role update performed by admin'
    );
    
    RETURN FOUND;
END;
$$;