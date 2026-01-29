-- path: data/migrations/12_expenses/04_final_rls_fix.sql
-- Description: Final RLS and Grant fix for the Expenses module, mirroring the working diary_notes pattern.

-- =================================================================
-- Section 1: Advances Table
-- =================================================================

-- 1. Enable RLS
ALTER TABLE public.advances ENABLE ROW LEVEL SECURITY;

-- 2. Grant full permissions at the table level to the 'authenticated' role.
-- This is the crucial step. It allows authenticated users to attempt actions.
-- RLS policies will then handle the fine-grained row-level access.
GRANT ALL ON TABLE public.advances TO authenticated;
GRANT ALL ON TABLE public.advances TO admin, admin_pro; -- Also ensure admins have it explicitly

-- 3. Drop any previous policies to ensure a clean state
DROP POLICY IF EXISTS "Allow full access to authenticated users on advances" ON public.advances;
DROP POLICY IF EXISTS "policy_allow_all_advances" ON public.advances;

-- 4. Create a single, permissive policy for all authenticated users.
-- Because the GRANT is in place, this simple policy will now work as intended.
CREATE POLICY "policy_allow_all_advances"
ON public.advances
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);


-- =================================================================
-- Section 2: Expenses Table
-- =================================================================

-- 1. Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- 2. Grant full permissions at the table level
GRANT ALL ON TABLE public.expenses TO authenticated;
GRANT ALL ON TABLE public.expenses TO admin, admin_pro;

-- 3. Drop any previous policies
DROP POLICY IF EXISTS "Allow full access to authenticated users on expenses" ON public.expenses;
DROP POLICY IF EXISTS "policy_allow_all_expenses" ON public.expenses;

-- 4. Create a single, permissive policy
CREATE POLICY "policy_allow_all_expenses"
ON public.expenses
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);