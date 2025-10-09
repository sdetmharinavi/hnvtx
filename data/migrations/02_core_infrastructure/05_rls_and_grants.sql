-- path: data/migrations/02_core_infrastructure/05_rls_and_grants.sql
-- Description: Applies RLS policies and grants to core tables and views created in this module.

-- =================================================================
-- PART 1: GRANTS AND RLS FOR CORE TABLES
-- =================================================================

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'lookup_types', 'maintenance_areas', 'rings',
    'employee_designations', 'employees', 'nodes',
    'ofc_cables', 'ofc_connections',
    'folders', 'files'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
    
    -- Grant permissions to specific roles
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO admin;', tbl);
    EXECUTE format('GRANT SELECT ON public.%I TO viewer;', tbl);
    EXECUTE format('GRANT SELECT ON public.%I TO cpan_admin, maan_admin, sdh_admin, asset_admin, mng_admin;', tbl);
    
    -- Grant SELECT to the base authenticated role so SECURITY INVOKER functions can access the tables.
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated;', tbl);

    -- Admin Policy (Full Access)
    EXECUTE format('DROP POLICY IF EXISTS "policy_admin_all_%s" ON public.%I;', tbl, tbl);
    EXECUTE format($p$
      CREATE POLICY "policy_admin_all_%s" ON public.%I
      FOR ALL TO admin
      USING (is_super_admin() OR public.get_my_role() = 'admin')
      WITH CHECK (is_super_admin() OR public.get_my_role() = 'admin');
    $p$, tbl, tbl);

    -- Authenticated User SELECT Policy (RLS on views will handle fine-grained access)
    EXECUTE format('DROP POLICY IF EXISTS "policy_authenticated_select_%s" ON public.%I;', tbl, tbl);
    EXECUTE format($p$
      CREATE POLICY "policy_authenticated_select_%s" ON public.%I
      FOR SELECT TO authenticated
      USING (true);
    $p$, tbl, tbl);

    RAISE NOTICE 'Applied baseline RLS policies to %', tbl;
  END LOOP;
END;
$$;


-- =================================================================
-- PART 2: GRANTS FOR CORE VIEWS (Created in this module)
-- =================================================================
DO $$
BEGIN
  -- Grant SELECT on all views created in this module to all relevant roles.
  GRANT SELECT ON 
    public.v_lookup_types,
    public.v_maintenance_areas,
    public.v_employee_designations,
    public.v_employees,
    public.v_nodes_complete,
    public.v_ofc_cables_complete
  TO admin, viewer, cpan_admin, maan_admin, sdh_admin, asset_admin, mng_admin, authenticated;

  RAISE NOTICE 'Applied SELECT grants on core infrastructure views.';
END;
$$;