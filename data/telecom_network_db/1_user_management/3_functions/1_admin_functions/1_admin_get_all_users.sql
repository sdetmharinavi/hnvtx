-- Function to get all users (admin only)
CREATE OR REPLACE FUNCTION public.admin_get_all_users (
    search_query TEXT DEFAULT NULL,
    filter_role TEXT DEFAULT NULL,
    filter_status TEXT DEFAULT NULL,
    date_from TIMESTAMPTZ DEFAULT NULL,
    date_to TIMESTAMPTZ DEFAULT NULL,
    page_offset INTEGER DEFAULT 0,
    page_limit INTEGER DEFAULT 50
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
    updated_at timestamptz,
    total_count bigint
) LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE 
    total_records bigint;
BEGIN 
    -- Check if user is super admin
    IF NOT public.is_super_admin() THEN 
        RAISE EXCEPTION 'Access denied. Super admin privileges required.';
    END IF;
    
    -- Get total count first
    SELECT COUNT(*) INTO total_records
    FROM public.user_profiles p
    WHERE (
        search_query IS NULL
        OR p.first_name ILIKE '%' || search_query || '%'
        OR p.last_name ILIKE '%' || search_query || '%'
    )
    AND (
        filter_role IS NULL
        OR filter_role = 'all'
        OR p.role = filter_role
    )
    AND (
        filter_status IS NULL
        OR filter_status = 'all'
        OR p.status = filter_status
    )
    AND (
        date_from IS NULL
        OR p.created_at >= date_from
    )
    AND (
        date_to IS NULL
        OR p.created_at <= date_to
    );
    
    -- Return paginated results with auth data
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
        p.updated_at,
        total_records
    FROM public.user_profiles p
    LEFT JOIN auth.users u ON p.id = u.id
    WHERE (
        search_query IS NULL
        OR p.first_name ILIKE '%' || search_query || '%'
        OR p.last_name ILIKE '%' || search_query || '%'
    )
    AND (
        filter_role IS NULL
        OR filter_role = 'all'
        OR p.role = filter_role
    )
    AND (
        filter_status IS NULL
        OR filter_status = 'all'
        OR p.status = filter_status
    )
    AND (
        date_from IS NULL
        OR p.created_at >= date_from
    )
    AND (
        date_to IS NULL
        OR p.created_at <= date_to
    )
    ORDER BY p.created_at DESC 
    OFFSET page_offset
    LIMIT page_limit;
END;
$$;