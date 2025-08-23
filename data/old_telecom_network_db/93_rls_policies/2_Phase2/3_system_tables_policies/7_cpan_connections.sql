-- CPAN connections RLS policies
DO $$
DECLARE 
  tbl text;
  role text;
BEGIN 
  -- Tables with extended access
  FOREACH tbl IN ARRAY ARRAY ['cpan_connections'] 
  LOOP 
    -- Drop viewer_read_access first (common)
    EXECUTE format('DROP POLICY IF EXISTS viewer_read_access ON public.%s;', tbl);
    EXECUTE format($f$
      CREATE POLICY viewer_read_access ON public.%I 
      FOR SELECT TO viewer 
      USING (((SELECT auth.jwt())->>'role') = 'viewer');
    $f$, tbl);
  END LOOP;

  -- CPAN connections: admin + cpan_admin
  FOREACH tbl IN ARRAY ARRAY ['cpan_connections'] 
  LOOP 
    FOREACH role IN ARRAY ARRAY ['admin', 'cpan_admin'] 
    LOOP 
      -- SELECT
      EXECUTE format('DROP POLICY IF EXISTS allow_%s_select ON public.%s;', role, tbl);
      EXECUTE format($f$
        CREATE POLICY allow_%s_select ON public.%I 
        FOR SELECT TO %I 
        USING (((SELECT auth.jwt())->>'role') = '%s');
      $f$, role, tbl, role, role);

      -- INSERT
      EXECUTE format('DROP POLICY IF EXISTS allow_%s_insert ON public.%s;', role, tbl);
      EXECUTE format($f$
        CREATE POLICY allow_%s_insert ON public.%I 
        FOR INSERT TO %I 
        WITH CHECK (((SELECT auth.jwt())->>'role') = '%s');
      $f$, role, tbl, role, role);

      -- UPDATE
      EXECUTE format('DROP POLICY IF EXISTS allow_%s_update ON public.%s;', role, tbl);
      EXECUTE format($f$
        CREATE POLICY allow_%s_update ON public.%I 
        FOR UPDATE TO %I 
        USING (((SELECT auth.jwt())->>'role') = '%s')
        WITH CHECK (((SELECT auth.jwt())->>'role') = '%s');
      $f$, role, tbl, role, role, role);

      -- DELETE
      EXECUTE format('DROP POLICY IF EXISTS allow_%s_delete ON public.%s;', role, tbl);
      EXECUTE format($f$
        CREATE POLICY allow_%s_delete ON public.%I 
        FOR DELETE TO %I 
        USING (((SELECT auth.jwt())->>'role') = '%s');
      $f$, role, tbl, role, role);
    END LOOP;
  END LOOP;
END;
$$;