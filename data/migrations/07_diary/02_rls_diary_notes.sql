-- path: data/migrations/07_diary/02_rls_diary_notes.sql
-- Description: Applies a tiered Row-Level Security model to the diary_notes table.

-- =================================================================
-- Section 1: Enable RLS & Define Table-Level Grants
-- =================================================================

-- Enable RLS
ALTER TABLE public.diary_notes ENABLE ROW LEVEL SECURITY;

-- Grant all actions at the table level. RLS policies will then filter what is allowed.
GRANT ALL ON public.diary_notes TO authenticated;
-- Grant necessary permissions to admin roles. RLS will scope their access.
GRANT ALL ON public.diary_notes TO admin;
GRANT ALL ON public.diary_notes TO admin_pro;


-- =================================================================
-- Section 2: RLS Policies for diary_notes
-- =================================================================

-- Drop old policies for idempotency
DROP POLICY IF EXISTS "Users can manage their own diary notes" ON public.diary_notes;
DROP POLICY IF EXISTS "Admins can read all diary notes" ON public.diary_notes;
DROP POLICY IF EXISTS "Pro Admins can manage all diary notes" ON public.diary_notes;
DROP POLICY IF EXISTS "Admins and Pro Admins can manage all diary notes" ON public.diary_notes;

-- Policy 1: (UNCHANGED) Baseline for all authenticated users.
-- Allows users to fully manage their own entries.
CREATE POLICY "Users can manage their own diary notes"
ON public.diary_notes
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


-- DELETED POLICY: The "Admins can read all diary notes" policy was removed as it is now redundant.


-- Policy 2: (REVISED) Full management access for Admins, Pro Admins & Super Admins.
-- This policy now correctly grants FOR ALL permissions (SELECT, INSERT, UPDATE, DELETE) to both 'admin' and 'admin_pro' roles.
CREATE POLICY "Admins and Pro Admins can manage all diary notes"
ON public.diary_notes
FOR ALL
TO admin, admin_pro
USING (is_super_admin() OR get_my_role() IN ('admin', 'admin_pro'))
WITH CHECK (is_super_admin() OR get_my_role() IN ('admin', 'admin_pro'));