-- path: data/migrations/07_diary/02_rls_diary_notes.sql
-- Description: Applies Row-Level Security to the diary_notes table. [REVISED FOR ADMIN_PRO & SECURITY]

-- =================================================================
-- Section 1: Enable RLS & Define Table-Level Grants
-- =================================================================

-- Enable RLS
ALTER TABLE public.diary_notes ENABLE ROW LEVEL SECURITY;

-- [CHANGED] More precise grants.
-- Authenticated users can perform all actions, but RLS will scope it to their own notes.
GRANT ALL ON public.diary_notes TO authenticated;

-- Grant specific permissions to admin roles.
GRANT SELECT ON public.diary_notes TO admin;
GRANT SELECT, DELETE ON public.diary_notes TO admin_pro;


-- =================================================================
-- Section 2: RLS Policies for diary_notes
-- =================================================================

-- Drop old policies for idempotency
DROP POLICY IF EXISTS "Users can manage their own diary notes" ON public.diary_notes;
DROP POLICY IF EXISTS "Admins can read all diary notes" ON public.diary_notes;
DROP POLICY IF EXISTS "Pro Admins can delete any diary note" ON public.diary_notes;


-- Policy 1: Users can manage their own notes. (No changes, already perfect)
-- This is the primary policy ensuring user privacy.
CREATE POLICY "Users can manage their own diary notes"
ON public.diary_notes
FOR ALL -- Applies to SELECT, INSERT, UPDATE, DELETE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


-- [NEW] Policy 2: Admins can read all diary notes for support/auditing.
-- This policy is for SELECT only. A standard 'admin' cannot modify or delete another user's notes.
CREATE POLICY "Admins can read all diary notes"
ON public.diary_notes
FOR SELECT
TO admin, admin_pro -- Both roles can read
USING (is_super_admin() OR get_my_role() IN ('admin', 'admin_pro'));


-- [NEW] Policy 3: Pro Admins can delete any diary note for administrative purposes.
-- This policy grants deletion rights ONLY to the top-level 'admin_pro' role.
CREATE POLICY "Pro Admins can delete any diary note"
ON public.diary_notes
FOR DELETE
TO admin_pro
USING (is_super_admin() OR get_my_role() = 'admin_pro');