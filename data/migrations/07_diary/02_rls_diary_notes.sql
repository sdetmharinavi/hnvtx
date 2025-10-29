-- path: data/migrations/07_diary/02_rls_diary_notes.sql
-- Description: Applies Row-Level Security to the diary_notes table.

-- 1. Enable RLS
ALTER TABLE public.diary_notes ENABLE ROW LEVEL SECURITY;

-- 2. Grant Permissions
GRANT ALL ON public.diary_notes TO authenticated;
GRANT ALL ON public.diary_notes TO admin;
GRANT SELECT ON public.diary_notes TO viewer;

-- 3. Create Policies
DROP POLICY IF EXISTS "Users can manage their own diary notes" ON public.diary_notes;

-- Policy: Allow users full control (SELECT, INSERT, UPDATE, DELETE) over their own diary notes.
CREATE POLICY "Users can manage their own diary notes"
ON public.diary_notes
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admin can read all diary notes
CREATE POLICY "Admin can read all diary notes"
ON public.diary_notes
FOR ALL
USING (is_super_admin() OR get_my_role() = 'admin')
WITH CHECK (is_super_admin() OR get_my_role() = 'admin');