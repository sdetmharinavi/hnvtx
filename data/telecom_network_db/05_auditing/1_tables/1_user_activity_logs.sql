
CREATE TABLE IF NOT EXISTS public.user_activity_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE
    SET NULL,
        user_role TEXT,
        action_type TEXT NOT NULL,
        table_name TEXT,
        record_id TEXT,
        old_data JSONB,
        new_data JSONB,
        details TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON public.user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_action_type ON public.user_activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_table_name ON public.user_activity_logs(table_name);
-- Enable RLS
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Create Policy to give access to admin role || isSuperAdmin only
DROP POLICY IF EXISTS allow_admin_select ON public.user_activity_logs;
DROP POLICY IF EXISTS allow_admin_insert ON public.user_activity_logs;
DROP POLICY IF EXISTS allow_admin_update ON public.user_activity_logs;
-- SELECT policies
CREATE POLICY allow_admin_select ON public.user_activity_logs FOR
SELECT TO admin USING (true);
-- INSERT policies
CREATE POLICY allow_admin_insert ON public.user_activity_logs FOR
INSERT TO admin WITH CHECK (true);
-- UPDATE policies
CREATE POLICY allow_admin_update ON public.user_activity_logs FOR
UPDATE TO admin USING (true) WITH CHECK (true);
-- Table Grant
GRANT ALL ON public.user_activity_logs TO admin;