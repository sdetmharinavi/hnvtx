-- Function to get a single user by ID (admin only)
CREATE OR REPLACE FUNCTION public.admin_get_user_by_id (
    user_id uuid
) RETURNS TABLE (
    id uuid,
    email text,
    first_name text,
    last_name text,
    avatar_url text,
    phone_number text,
    date_of_birth date,
    address jsonb,
    preferences jsonb,
    role text,
    designation text,
    status text,
    is_email_verified boolean,
    last_sign_in_at timestamptz,
    created_at timestamptz,
    updated_at timestamptz
) LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$ 
BEGIN 
    -- Check if user is super admin or accessing their own profile
    IF NOT (
        public.is_super_admin()
        OR auth.uid() = user_id
    ) THEN 
        RAISE EXCEPTION 'Access denied. Insufficient privileges.';
    END IF;
    
    RETURN QUERY
    SELECT 
        p.id,
        CAST(u.email AS text) as email,
        p.first_name,
        p.last_name,
        p.avatar_url,
        p.phone_number,
        p.date_of_birth,
        p.address,
        p.preferences,
        p.role,
        p.designation,
        p.status,
        (u.email_confirmed_at IS NOT NULL) as is_email_verified,
        u.last_sign_in_at,
        p.created_at,
        p.updated_at
    FROM public.user_profiles p
    LEFT JOIN auth.users u ON p.id = u.id
    WHERE p.id = user_id;
END;
$$;