-- Core tables RLS policies (lookup_types, maintenance_areas, rings, etc.)
DO $$
DECLARE 
  tbl text;
BEGIN 
  FOREACH tbl IN ARRAY ARRAY[
    'lookup_types', 'maintenance_areas', 'rings', 
    'employee_designations', 'employees', 'nodes', 
    'ofc_cables', 'ofc_connections'
  ] 
  LOOP 
    -- Cleanup old policies
    EXECUTE format('DROP POLICY IF EXISTS policy_select_%s ON public.%s;', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS policy_insert_%s ON public.%s;', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS policy_update_%s ON public.%s;', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS policy_delete_%s ON public.%s;', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS policy_write_%s ON public.%s;', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS viewer_read_access ON public.%s;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS allow_admin_select ON public.%s;', tbl);

    -- SELECT policies
    EXECUTE format($f$
      CREATE POLICY viewer_read_access ON public.%I 
      FOR SELECT TO viewer 
      USING (((SELECT auth.jwt())->>'role') = 'viewer');
    $f$, tbl);

    EXECUTE format($f$
      CREATE POLICY allow_admin_select ON public.%I 
      FOR SELECT TO admin 
      USING (((SELECT auth.jwt())->>'role') = 'admin');
    $f$, tbl);

    -- INSERT policy
    EXECUTE format($f$
      CREATE POLICY allow_admin_insert ON public.%I 
      FOR INSERT TO admin 
      WITH CHECK (((SELECT auth.jwt())->>'role') = 'admin');
    $f$, tbl);

    -- UPDATE policy
    EXECUTE format($f$
      CREATE POLICY allow_admin_update ON public.%I 
      FOR UPDATE TO admin 
      USING (((SELECT auth.jwt())->>'role') = 'admin')
      WITH CHECK (((SELECT auth.jwt())->>'role') = 'admin');
    $f$, tbl);

    -- DELETE policy
    EXECUTE format($f$
      CREATE POLICY allow_admin_delete ON public.%I 
      FOR DELETE TO admin 
      USING (((SELECT auth.jwt())->>'role') = 'admin');
    $f$, tbl);
  END LOOP;
END;
$$;