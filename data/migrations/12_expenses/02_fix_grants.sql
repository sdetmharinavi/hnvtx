-- path: data/migrations/12_expenses/05_force_permissions_fix.sql

-- =================================================================
-- 1. FIX THE ROOT CAUSE: Audit Log Permissions
-- The trigger on 'advances' writes to 'user_activity_logs'.
-- If the user can't write to logs, they can't write to advances.
-- =================================================================

-- Allow authenticated users to INSERT into the log table (needed for triggers)
GRANT INSERT ON TABLE public.user_activity_logs TO authenticated;

-- Ensure there is a policy allowing this INSERT
DROP POLICY IF EXISTS "Allow insert for all authenticated" ON public.user_activity_logs;
CREATE POLICY "Allow insert for all authenticated"
ON public.user_activity_logs
FOR INSERT
TO authenticated
WITH CHECK (true);


-- =================================================================
-- 2. RESET ADVANCES PERMISSIONS
-- =================================================================

ALTER TABLE public.advances ENABLE ROW LEVEL SECURITY;

-- Ensure privileges exist
GRANT ALL ON TABLE public.advances TO authenticated;
GRANT ALL ON TABLE public.advances TO service_role;

-- Drop ALL potential conflicting policies to ensure a clean slate
DROP POLICY IF EXISTS "Allow full access to authenticated users on advances" ON public.advances;
DROP POLICY IF EXISTS "policy_allow_all_advances" ON public.advances;
DROP POLICY IF EXISTS "Enable All" ON public.advances;
DROP POLICY IF EXISTS "Users can manage advances" ON public.advances;
DROP POLICY IF EXISTS "advances_policy" ON public.advances;

-- Create ONE simple, permissive policy
CREATE POLICY "policy_advances_universal_access"
ON public.advances
FOR ALL
TO public
USING (true)
WITH CHECK (true);


-- =================================================================
-- 3. RESET EXPENSES PERMISSIONS
-- =================================================================

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Ensure privileges exist
GRANT ALL ON TABLE public.expenses TO authenticated;
GRANT ALL ON TABLE public.expenses TO service_role;

-- Drop ALL potential conflicting policies
DROP POLICY IF EXISTS "Allow full access to authenticated users on expenses" ON public.expenses;
DROP POLICY IF EXISTS "policy_allow_all_expenses" ON public.expenses;
DROP POLICY IF EXISTS "Enable All" ON public.expenses;
DROP POLICY IF EXISTS "Users can manage expenses" ON public.expenses;
DROP POLICY IF EXISTS "expenses_policy" ON public.expenses;

-- Create ONE simple, permissive policy
CREATE POLICY "policy_expenses_universal_access"
ON public.expenses
FOR ALL
TO public
USING (true)
WITH CHECK (true);