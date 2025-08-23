-- Enhanced admin function that leverages the view structure
CREATE OR REPLACE FUNCTION admin_get_all_users_extended(
    search_query TEXT DEFAULT NULL,
    filter_role TEXT DEFAULT NULL,
    filter_status TEXT DEFAULT NULL,
    filter_activity TEXT DEFAULT NULL,
    date_from TIMESTAMPTZ DEFAULT NULL,
    date_to TIMESTAMPTZ DEFAULT NULL,
    page_offset INTEGER DEFAULT 0,
    page_limit INTEGER DEFAULT 50
) RETURNS TABLE (
    id uuid,
    email text,
    last_sign_in_at timestamptz,
    created_at timestamptz,
    is_super_admin boolean,
    is_email_verified boolean,
    first_name text,
    last_name text,
    avatar_url text,
    phone_number text,
    date_of_birth date,
    address jsonb,
    preferences jsonb,
    role text,
    designation text,
    updated_at timestamptz,
    status text,
    full_name text,
    computed_status text,
    account_age_days integer,
    last_activity_period text,
    total_count bigint
) 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, auth
AS $$
DECLARE 
    total_records bigint;
BEGIN
    -- Check if user is super admin
    IF NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'Access denied. Super admin privileges required.';
    END IF;
    
    -- Get total count
    SELECT COUNT(*) INTO total_records
    FROM v_user_profiles_extended v
    WHERE (
        search_query IS NULL 
        OR v.first_name ILIKE '%' || search_query || '%'
        OR v.last_name ILIKE '%' || search_query || '%'
        OR v.email ILIKE '%' || search_query || '%'
        OR v.full_name ILIKE '%' || search_query || '%'
    )
    AND (
        filter_role IS NULL 
        OR filter_role = 'all' 
        OR v.role = filter_role
    )
    AND (
        filter_status IS NULL 
        OR filter_status = 'all' 
        OR v.status = filter_status
    )
    AND (
        filter_activity IS NULL 
        OR filter_activity = 'all' 
        OR v.last_activity_period = filter_activity
    )
    AND (
        date_from IS NULL 
        OR v.created_at >= date_from
    )
    AND (
        date_to IS NULL 
        OR v.created_at <= date_to
    );
    
    -- Return paginated results
    RETURN QUERY
    SELECT 
        v.id,
        v.email,
        v.last_sign_in_at,
        v.created_at,
        v.is_super_admin,
        v.is_email_verified,
        v.first_name,
        v.last_name,
        v.avatar_url,
        v.phone_number,
        v.date_of_birth,
        v.address,
        v.preferences,
        v.role,
        v.designation,
        v.updated_at,
        v.status,
        v.full_name,
        v.computed_status,
        v.account_age_days,
        v.last_activity_period,
        total_records
    FROM public.v_user_profiles_extended v
    WHERE (
        search_query IS NULL 
        OR v.first_name ILIKE '%' || search_query || '%'
        OR v.last_name ILIKE '%' || search_query || '%'
        OR v.email ILIKE '%' || search_query || '%'
        OR v.full_name ILIKE '%' || search_query || '%'
    )
    AND (
        filter_role IS NULL 
        OR filter_role = 'all' 
        OR v.role = filter_role
    )
    AND (
        filter_status IS NULL 
        OR filter_status = 'all' 
        OR v.status = filter_status
    )
    AND (
        filter_activity IS NULL 
        OR filter_activity = 'all' 
        OR v.last_activity_period = filter_activity
    )
    AND (
        date_from IS NULL 
        OR v.created_at >= date_from
    )
    AND (
        date_to IS NULL 
        OR v.created_at <= date_to
    )
    ORDER BY v.created_at DESC
    OFFSET page_offset
    LIMIT page_limit;
END;
$$;

-- Grant execute permission on the enhanced admin function
GRANT EXECUTE ON FUNCTION public.admin_get_all_users_extended(
    text, text, text, text, timestamptz, timestamptz, integer, integer
) TO authenticated;