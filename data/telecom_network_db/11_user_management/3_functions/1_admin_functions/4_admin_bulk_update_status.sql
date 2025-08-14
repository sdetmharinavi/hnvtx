-- Function to bulk update user status (admin only)
CREATE OR REPLACE FUNCTION public.admin_bulk_update_status (
    user_ids uuid[], 
    new_status text
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$ 
BEGIN 
    -- Check if user is super admin
    IF NOT public.is_super_admin() THEN 
        RAISE EXCEPTION 'Access denied. Super admin privileges required.';
    END IF;
    
    -- Validate status
    IF new_status NOT IN ('active', 'inactive', 'suspended') THEN 
        RAISE EXCEPTION 'Invalid status. Must be active, inactive, or suspended.';
    END IF;
    
    UPDATE public.user_profiles
    SET 
        status = new_status,
        updated_at = NOW()
    WHERE id = ANY(user_ids);
    
    RETURN FOUND;
END;
$$;