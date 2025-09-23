-- Path: migrations/01_user_management/02_views.sql
-- Description: Defines views for the User Management module.

-- Extended view combining auth.users and public.user_profiles
CREATE OR REPLACE VIEW v_user_profiles_extended WITH (security_invoker = true) AS
SELECT
    u.id,
    u.email::text AS email,
    u.last_sign_in_at,
    u.created_at,
    u.is_super_admin,
    (u.email_confirmed_at IS NOT NULL) AS is_email_verified,
    p.first_name::text AS first_name,
    p.last_name::text AS last_name,
    p.avatar_url::text AS avatar_url,
    p.phone_number::text AS phone_number,
    p.date_of_birth,
    p.address,
    p.preferences,
    p.role::text AS role,
    p.designation::text AS designation,
    p.updated_at,
    p.status::text AS status,
    u.email_confirmed_at,
    u.phone_confirmed_at,
    (u.phone_confirmed_at IS NOT NULL) AS is_phone_verified,
    u.updated_at AS auth_updated_at,
    u.raw_user_meta_data,
    u.raw_app_meta_data,
    CONCAT(p.first_name::text, ' ', p.last_name::text) AS full_name,
    CASE
        WHEN p.status::text = 'active' AND u.email_confirmed_at IS NOT NULL THEN 'active_verified'
        WHEN p.status::text = 'active' AND u.email_confirmed_at IS NULL THEN 'active_unverified'
        WHEN p.status::text = 'inactive' THEN 'inactive'
        WHEN p.status::text = 'suspended' THEN 'suspended'
        ELSE 'unknown'
    END::text AS computed_status,
    EXTRACT(DAYS FROM (NOW() - u.created_at))::INTEGER AS account_age_days,
    CASE
        WHEN u.last_sign_in_at > NOW() - INTERVAL '1 day' THEN 'today'
        WHEN u.last_sign_in_at > NOW() - INTERVAL '7 days' THEN 'this_week'
        WHEN u.last_sign_in_at > NOW() - INTERVAL '30 days' THEN 'this_month'
        WHEN u.last_sign_in_at > NOW() - INTERVAL '90 days' THEN 'last_3_months'
        ELSE 'older'
    END::text AS last_activity_period
FROM auth.users u
JOIN public.user_profiles p ON u.id = p.id;