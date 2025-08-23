-- Function to update user profile (admin only)
CREATE OR REPLACE FUNCTION public.admin_update_user_profile (
    user_id uuid,
    update_first_name text DEFAULT NULL,
    update_last_name text DEFAULT NULL,
    update_avatar_url text DEFAULT NULL,
    update_phone_number text DEFAULT NULL,
    update_date_of_birth date DEFAULT NULL,
    update_address jsonb DEFAULT NULL,
    update_preferences jsonb DEFAULT NULL,
    update_role text DEFAULT NULL,
    update_designation text DEFAULT NULL,
    update_status text DEFAULT NULL
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$ 
BEGIN 
    -- Check if user is super admin or updating their own profile
    IF NOT (
        public.is_super_admin()
        OR auth.uid() = user_id
    ) THEN 
        RAISE EXCEPTION 'Access denied. Insufficient privileges.';
    END IF;
    
    -- Update only non-null fields
    UPDATE public.user_profiles
    SET 
        first_name = COALESCE(update_first_name, first_name),
        last_name = COALESCE(update_last_name, last_name),
        avatar_url = CASE
            WHEN update_avatar_url = '' THEN NULL
            ELSE COALESCE(update_avatar_url, avatar_url)
        END,
        phone_number = CASE
            WHEN update_phone_number = '' THEN NULL
            ELSE COALESCE(update_phone_number, phone_number)
        END,
        date_of_birth = COALESCE(update_date_of_birth, date_of_birth),
        address = COALESCE(update_address, address),
        preferences = COALESCE(update_preferences, preferences),
        role = COALESCE(update_role, role),
        designation = COALESCE(update_designation, designation),
        status = COALESCE(update_status, status),
        updated_at = NOW()
    WHERE id = user_id;
    
    RETURN FOUND;
END;
$$;