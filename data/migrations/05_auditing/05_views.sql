-- Path: data/migrations/05_auditing/05_views.sql
-- Description: Creates a view for audit logs with user details.

CREATE OR REPLACE VIEW public.v_audit_logs WITH (security_invoker = true) AS
SELECT
    al.id,
    al.user_id,
    al.user_role,
    al.action_type,
    al.table_name,
    al.record_id,
    al.old_data,
    al.new_data,
    al.details,
    al.created_at,
    p.full_name AS performed_by_name,
    p.email AS performed_by_email,
    p.avatar_url AS performed_by_avatar
FROM public.user_activity_logs al
LEFT JOIN public.v_user_profiles_extended p ON al.user_id = p.id;

-- Grant access
GRANT SELECT ON public.v_audit_logs TO admin;