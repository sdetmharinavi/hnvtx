-- USER DETAILS FUNCTION
CREATE OR REPLACE FUNCTION get_my_user_details() 
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