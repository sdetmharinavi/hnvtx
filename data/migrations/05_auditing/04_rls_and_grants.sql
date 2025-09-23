-- Path: supabase/migrations/05_auditing/04_rls_and_grants.sql
-- Description: Secures the user_activity_logs table, allowing access only to admins.

-- Enable Row Level Security on the log table
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Grant table-level permissions to the 'admin' role
GRANT ALL ON public.user_activity_logs TO admin;

-- Drop existing policies for idempotency
DROP POLICY IF EXISTS "Allow full access to admins" ON public.user_activity_logs;

-- Create a single policy granting full access (SELECT, INSERT, UPDATE, DELETE)
-- only to users who are super_admins or have the 'admin' role.
CREATE POLICY "Allow full access to admins"
ON public.user_activity_logs
FOR ALL
TO admin
USING (is_super_admin() OR get_my_role() = 'admin')
WITH CHECK (is_super_admin() OR get_my_role() = 'admin');