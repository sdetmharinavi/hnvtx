-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
-- Drop existing policies
DROP POLICY IF EXISTS "allow_own_profile_access_or_superadmin_access" ON public.user_profiles;
-- Simplified policies - most admin operations go through functions
CREATE POLICY "allow_own_profile_access_or_superadmin_access" ON public.user_profiles 
FOR ALL TO authenticated 
USING (
    id = ((SELECT auth.uid())) OR 
    ((SELECT auth.jwt())->>'role') = 'admin') OR
    public.is_super_admin()
) 
WITH CHECK (
    id = ((SELECT auth.uid())) OR 
    ((SELECT auth.jwt())->>'role') = 'admin') OR
    public.is_super_admin()
);