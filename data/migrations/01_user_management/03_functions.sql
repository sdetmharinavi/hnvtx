-- Path: migrations/01_user_management/03_functions.sql
-- Description: All functions for the User Management module.

-- =================================================================
-- Section 1: Utility Functions
-- =================================================================

-- SUPER ADMIN CHECK FUNCTION
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = auth.uid()
      AND is_super_admin = true
  );
$$;

-- GET MY ROLE FUNCTION
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
SELECT role
FROM auth.users
WHERE id = auth.uid();
$$;

-- USER DETAILS FUNCTION
CREATE OR REPLACE FUNCTION public.get_my_user_details()
RETURNS TABLE (
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
    updated_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
SELECT
    u.id,
    u.email,
    u.last_sign_in_at,
    u.created_at,
    u.is_super_admin,
    (u.email_confirmed_at IS NOT NULL) AS is_email_verified,
    p.first_name,
    p.last_name,
    p.avatar_url,
    p.phone_number,
    p.date_of_birth,
    p.address,
    p.preferences,
    p.role,
    p.designation,
    p.updated_at
FROM auth.users AS u
LEFT JOIN public.user_profiles AS p ON u.id = p.id
WHERE u.id = auth.uid();
$$;


-- =================================================================
-- Section 2: Admin RPC Functions
-- =================================================================

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
    IF NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'Access denied. Super admin privileges required.';
    END IF;

    SELECT COUNT(*) INTO total_records
    FROM public.user_profiles p
    WHERE (search_query IS NULL OR p.first_name ILIKE '%' || search_query || '%' OR p.last_name ILIKE '%' || search_query || '%')
    AND (filter_role IS NULL OR filter_role = 'all' OR p.role = filter_role)
    AND (filter_status IS NULL OR filter_status = 'all' OR p.status = filter_status)
    AND (date_from IS NULL OR p.created_at >= date_from)
    AND (date_to IS NULL OR p.created_at <= date_to);

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
    WHERE (search_query IS NULL OR p.first_name ILIKE '%' || search_query || '%' OR p.last_name ILIKE '%' || search_query || '%')
    AND (filter_role IS NULL OR filter_role = 'all' OR p.role = filter_role)
    AND (filter_status IS NULL OR filter_status = 'all' OR p.status = filter_status)
    AND (date_from IS NULL OR p.created_at >= date_from)
    AND (date_to IS NULL OR p.created_at <= date_to)
    ORDER BY p.created_at DESC
    OFFSET page_offset
    LIMIT page_limit;
END;
$$;

-- Enhanced admin function that leverages the view structure
CREATE OR REPLACE FUNCTION public.admin_get_all_users_extended(
    search_query TEXT DEFAULT NULL,
    filter_role TEXT DEFAULT NULL,
    filter_status TEXT DEFAULT NULL,
    filter_activity TEXT DEFAULT NULL,
    date_from TIMESTAMPTZ DEFAULT NULL,
    date_to TIMESTAMPTZ DEFAULT NULL,
    page_offset INTEGER DEFAULT 0,
    page_limit INTEGER DEFAULT 50
) RETURNS TABLE (
    id uuid, email text, last_sign_in_at timestamptz, created_at timestamptz, is_super_admin boolean, is_email_verified boolean,
    first_name text, last_name text, avatar_url text, phone_number text, date_of_birth date, address jsonb, preferences jsonb,
    role text, designation text, updated_at timestamptz, status text, full_name text, computed_status text, account_age_days integer,
    last_activity_period text, total_count bigint, active_count bigint, inactive_count bigint
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth
AS $$
DECLARE
    total_records bigint;
BEGIN
    IF NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'Access denied. Super admin privileges required.';
    END IF;

    SELECT COUNT(*) INTO total_records
    FROM v_user_profiles_extended v
    WHERE (search_query IS NULL OR v.first_name ILIKE '%' || search_query || '%' OR v.last_name ILIKE '%' || search_query || '%' OR v.email ILIKE '%' || search_query || '%' OR v.full_name ILIKE '%' || search_query || '%')
    AND (filter_role IS NULL OR filter_role = 'all' OR v.role = filter_role)
    AND (filter_status IS NULL OR filter_status = 'all' OR v.status = filter_status)
    AND (filter_activity IS NULL OR filter_activity = 'all' OR v.last_activity_period = filter_activity)
    AND (date_from IS NULL OR v.created_at >= date_from)
    AND (date_to IS NULL OR v.created_at <= date_to);

    RETURN QUERY
    SELECT v.id, v.email, v.last_sign_in_at, v.created_at, v.is_super_admin, v.is_email_verified, v.first_name, v.last_name, v.avatar_url, v.phone_number,
           v.date_of_birth, v.address, v.preferences, v.role, v.designation, v.updated_at, v.status, v.full_name, v.computed_status, v.account_age_days,
           v.last_activity_period, total_records, v.active_count, v.inactive_count
    FROM public.v_user_profiles_extended v
    WHERE (search_query IS NULL OR v.first_name ILIKE '%' || search_query || '%' OR v.last_name ILIKE '%' || search_query || '%' OR v.email ILIKE '%' || search_query || '%' OR v.full_name ILIKE '%' || search_query || '%')
    AND (filter_role IS NULL OR filter_role = 'all' OR v.role = filter_role)
    AND (filter_status IS NULL OR filter_status = 'all' OR v.status = filter_status)
    AND (filter_activity IS NULL OR filter_activity = 'all' OR v.last_activity_period = filter_activity)
    AND (date_from IS NULL OR v.created_at >= date_from)
    AND (date_to IS NULL OR v.created_at <= date_to)
    ORDER BY v.created_at DESC
    OFFSET page_offset
    LIMIT page_limit;
END;
$$;


-- Function to get a single user by ID (admin only)
CREATE OR REPLACE FUNCTION public.admin_get_user_by_id ( user_id uuid )
RETURNS TABLE (
    id uuid, email text, first_name text, last_name text, avatar_url text, phone_number text, date_of_birth date, address jsonb,
    preferences jsonb, role text, designation text, status text, is_email_verified boolean, last_sign_in_at timestamptz,
    created_at timestamptz, updated_at timestamptz
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
    IF NOT (public.is_super_admin() OR auth.uid() = user_id) THEN
        RAISE EXCEPTION 'Access denied. Insufficient privileges.';
    END IF;
    RETURN QUERY
    SELECT p.id, CAST(u.email AS text) as email, p.first_name, p.last_name, p.avatar_url, p.phone_number, p.date_of_birth, p.address,
           p.preferences, p.role, p.designation, p.status, (u.email_confirmed_at IS NOT NULL) as is_email_verified, u.last_sign_in_at,
           p.created_at, p.updated_at
    FROM public.user_profiles p
    LEFT JOIN auth.users u ON p.id = u.id
    WHERE p.id = user_id;
END;
$$;

-- Function to update user profile (admin only)
CREATE OR REPLACE FUNCTION public.admin_update_user_profile (
    user_id uuid, update_first_name text DEFAULT NULL, update_last_name text DEFAULT NULL, update_avatar_url text DEFAULT NULL,
    update_phone_number text DEFAULT NULL, update_date_of_birth date DEFAULT NULL, update_address jsonb DEFAULT NULL,
    update_preferences jsonb DEFAULT NULL, update_role text DEFAULT NULL, update_designation text DEFAULT NULL, update_status text DEFAULT NULL
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
    IF NOT (public.is_super_admin() OR auth.uid() = user_id) THEN
        RAISE EXCEPTION 'Access denied. Insufficient privileges.';
    END IF;
    UPDATE public.user_profiles
    SET first_name = COALESCE(update_first_name, first_name),
        last_name = COALESCE(update_last_name, last_name),
        avatar_url = CASE WHEN update_avatar_url = '' THEN NULL ELSE COALESCE(update_avatar_url, avatar_url) END,
        phone_number = CASE WHEN update_phone_number = '' THEN NULL ELSE COALESCE(update_phone_number, phone_number) END,
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

-- Function to bulk update user status (admin only)
CREATE OR REPLACE FUNCTION public.admin_bulk_update_status ( user_ids uuid[], new_status text )
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
    IF NOT public.is_super_admin() THEN RAISE EXCEPTION 'Access denied. Super admin privileges required.'; END IF;
    IF new_status NOT IN ('active', 'inactive', 'suspended') THEN RAISE EXCEPTION 'Invalid status. Must be active, inactive, or suspended.'; END IF;
    UPDATE public.user_profiles SET status = new_status, updated_at = NOW() WHERE id = ANY(user_ids);
    PERFORM public.log_user_activity('BULK_UPDATE_STATUS', 'user_profiles', NULL, jsonb_build_object('user_ids', user_ids), jsonb_build_object('new_status', new_status), 'Bulk status update performed by admin');
    RETURN FOUND;
END;
$$;

-- Function to bulk update user role (admin only)
CREATE OR REPLACE FUNCTION public.admin_bulk_update_role ( user_ids uuid[], new_role text )
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
    IF NOT public.is_super_admin() THEN RAISE EXCEPTION 'Access denied. Super admin privileges required.'; END IF;
    IF new_role NOT IN ('admin', 'viewer', 'cpan_admin', 'maan_admin', 'sdh_admin', 'vmux_admin', 'mng_admin') THEN RAISE EXCEPTION 'Invalid role.'; END IF;
    UPDATE public.user_profiles SET role = new_role, updated_at = NOW() WHERE id = ANY(user_ids);
    PERFORM public.log_user_activity('BULK_UPDATE_ROLE', 'user_profiles', NULL, jsonb_build_object('user_ids', user_ids), jsonb_build_object('new_role', new_role), 'Bulk role update performed by admin');
    RETURN FOUND;
END;
$$;

-- Function to bulk delete users (admin only)
CREATE OR REPLACE FUNCTION public.admin_bulk_delete_users ( user_ids uuid[] )
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
    IF NOT public.is_super_admin() THEN RAISE EXCEPTION 'Access denied. Super admin privileges required.'; END IF;
    PERFORM public.log_user_activity('BULK_DELETE', 'user_profiles', NULL, jsonb_build_object('user_ids', user_ids), NULL, 'Bulk user deletion performed by admin');
    DELETE FROM public.user_profiles WHERE id = ANY(user_ids);
    RETURN FOUND;
END;
$$;


-- =================================================================
-- Section 3: Trigger Functions
-- =================================================================

-- TRIGGER FUNCTION for updating timestamps
CREATE OR REPLACE FUNCTION public.update_user_profile_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Function that will sync the role to auth.users
CREATE OR REPLACE FUNCTION public.sync_user_role_to_auth()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
    IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.role IS DISTINCT FROM OLD.role)) AND NEW.role IS NOT NULL THEN
        UPDATE auth.users SET role = NEW.role WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$;

-- USER CREATION FUNCTION
CREATE OR REPLACE FUNCTION public.create_public_profile_for_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = NEW.id) THEN
        INSERT INTO public.user_profiles (id, first_name, last_name, avatar_url, phone_number, date_of_birth, address, preferences, status)
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'name', (SELECT initcap(word) FROM regexp_split_to_table(split_part(NEW.email, '@', 1), '[^a-zA-Z]+') AS word WHERE word ~ '^[a-zA-Z]+' LIMIT 1), 'Placeholder'),
            COALESCE(NEW.raw_user_meta_data->>'last_name', SPLIT_PART(NEW.raw_user_meta_data->>'name', ' ', 2), 'User'),
            NEW.raw_user_meta_data->>'avatar_url',
            NEW.raw_user_meta_data->>'phone_number',
            CASE WHEN NEW.raw_user_meta_data->>'date_of_birth' ~ '^\d{4}-\d{2}-\d{2}$' THEN (NEW.raw_user_meta_data->>'date_of_birth')::date ELSE NULL END,
            COALESCE(NEW.raw_user_meta_data->'address', '{}'::jsonb),
            COALESCE(NEW.raw_user_meta_data->'preferences', '{}'::jsonb),
            'active'
        );
    END IF;
    RETURN NEW;
END;
$$;