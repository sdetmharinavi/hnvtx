-- path: data/migrations/12_expenses/03_fix_view_permissions.sql
-- Description: Explicitly grants SELECT permissions on expense views to authenticated users.

-- 1. Grant Permissions on Views
GRANT SELECT ON public.v_advances_complete TO authenticated;
GRANT SELECT ON public.v_expenses_complete TO authenticated;

-- 2. Grant Permissions on Roles (Just in case specific roles are being used)
GRANT SELECT ON public.v_advances_complete TO admin, admin_pro, viewer;
GRANT SELECT ON public.v_expenses_complete TO admin, admin_pro, viewer;

-- 3. Ensure RLS on underlying tables allows reading (Redundant safety check)
-- This ensures that the 'security_invoker' view can actually see the rows.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'advances' AND policyname = 'policy_advances_universal_access'
    ) THEN
        CREATE POLICY "policy_advances_universal_access" ON public.advances FOR ALL TO public USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'expenses' AND policyname = 'policy_expenses_universal_access'
    ) THEN
        CREATE POLICY "policy_expenses_universal_access" ON public.expenses FOR ALL TO public USING (true) WITH CHECK (true);
    END IF;
END $$;