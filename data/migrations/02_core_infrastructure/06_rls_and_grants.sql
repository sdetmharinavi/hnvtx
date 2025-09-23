-- Path: supabase/migrations/02_core_infrastructure/06_rls_and_grants.sql
-- Description: Applies a baseline set of RLS policies and grants to core tables.

DO $$
DECLARE
  tbl TEXT;
  admin_role TEXT := 'admin';
  viewer_role TEXT := 'viewer';
BEGIN
  -- This list includes all tables in this module that follow the simple admin/viewer security model.
  FOREACH tbl IN ARRAY ARRAY[
    'lookup_types', 'maintenance_areas', 'rings',
    'employee_designations', 'employees', 'nodes',
    'ofc_cables', 'ofc_connections',
    'folders', 'files'
  ]
  LOOP
    -- Step 1: Enable Row-Level Security
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);

    -- Step 2: Set Table-Level Grants
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO %I;', tbl, admin_role);
    EXECUTE format('GRANT SELECT ON public.%I TO %I;', tbl, viewer_role);

    -- Step 3: Create Row-Level Security Policies (idempotent)
    EXECUTE format('DROP POLICY IF EXISTS "policy_admin_all_%s" ON public.%I;', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "policy_viewer_select_%s" ON public.%I;', tbl, tbl);

    -- Admin Policy: Full access for the 'admin' role or a super_admin user.
    EXECUTE format($p$
      CREATE POLICY "policy_admin_all_%s" ON public.%I
      FOR ALL TO %I
      USING (is_super_admin() OR public.get_my_role() = %L)
      WITH CHECK (is_super_admin() OR public.get_my_role() = %L);
    $p$, tbl, tbl, admin_role, admin_role, admin_role);

    -- Viewer Policy: Read-only access for the 'viewer' role.
    EXECUTE format($p$
      CREATE POLICY "policy_viewer_select_%s" ON public.%I
      FOR SELECT TO %I
      USING (public.get_my_role() = %L);
    $p$, tbl, tbl, viewer_role, viewer_role);

    RAISE NOTICE 'Applied baseline admin/viewer grants and policies to %', tbl;
  END LOOP;
END;
$$;