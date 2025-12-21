-- path: data/migrations/02_core_infrastructure/05_rls_and_grants.sql
-- Description: Applies RLS policies and grants to core tables and views created in this module. [REVISED FOR SECURITY & ROLE SEPARATION]

-- =================================================================
-- PART 1: GRANTS AND RLS FOR SHARED INFRASTRUCTURE TABLES
-- These tables contain data that is generally public to all authenticated users of the application.
-- =================================================================

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'maintenance_areas', 'rings', 'employee_designations', 
    'employees', 'nodes', 'folders', 'files'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
    
    -- Grants are now separated for admin_pro and admin
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO admin, admin_pro;', tbl);
    EXECUTE format('GRANT SELECT ON public.%I TO viewer;', tbl);
    EXECUTE format('GRANT SELECT ON public.%I TO cpan_admin, maan_admin, sdh_admin, asset_admin, mng_admin;', tbl);
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated;', tbl);

    -- Admin Policy (Full Access for admin & admin_pro)
    EXECUTE format('DROP POLICY IF EXISTS "policy_admin_all_%s" ON public.%I;', tbl, tbl);
    EXECUTE format($p$
      CREATE POLICY "policy_admin_all_%s" ON public.%I
      FOR ALL TO admin, admin_pro
      USING (is_super_admin() OR public.get_my_role() IN ('admin', 'admin_pro'))
      WITH CHECK (is_super_admin() OR public.get_my_role() IN ('admin', 'admin_pro'));
    $p$, tbl, tbl);

    -- Authenticated User SELECT Policy (Allow any logged-in user to read this shared data)
    EXECUTE format('DROP POLICY IF EXISTS "policy_authenticated_select_%s" ON public.%I;', tbl, tbl);
    EXECUTE format($p$
      CREATE POLICY "policy_authenticated_select_%s" ON public.%I
      FOR SELECT TO authenticated
      USING (true);
    $p$, tbl, tbl);
  END LOOP;
END;
$$;


DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'ofc_cables', 'ofc_connections'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
    
    -- Grants are now separated for admin_pro and admin
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO admin, admin_pro, ofc_admin;', tbl);
    EXECUTE format('GRANT SELECT ON public.%I TO viewer;', tbl);
    EXECUTE format('GRANT SELECT ON public.%I TO cpan_admin, maan_admin, sdh_admin, asset_admin, mng_admin;', tbl);
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated;', tbl);

    -- Admin Policy (Full Access for admin & admin_pro & ofc_admin)
    EXECUTE format('DROP POLICY IF EXISTS "policy_admin_all_%s" ON public.%I;', tbl, tbl);
    EXECUTE format($p$
      CREATE POLICY "policy_admin_all_%s" ON public.%I
      FOR ALL TO admin, admin_pro, ofc_admin
      USING (is_super_admin() OR public.get_my_role() IN ('admin', 'admin_pro', 'ofc_admin'))
      WITH CHECK (is_super_admin() OR public.get_my_role() IN ('admin', 'admin_pro', 'ofc_admin'));
    $p$, tbl, tbl);

    -- Authenticated User SELECT Policy (Allow any logged-in user to read this shared data)
    EXECUTE format('DROP POLICY IF EXISTS "policy_authenticated_select_%s" ON public.%I;', tbl, tbl);
    EXECUTE format($p$
      CREATE POLICY "policy_authenticated_select_%s" ON public.%I
      FOR SELECT TO authenticated
      USING (true);
    $p$, tbl, tbl);
  END LOOP;
END;
$$;



-- =================================================================
-- PART 2: GRANTS AND RLS FOR CONFIGURATION TABLES
-- The lookup_types table is critical for application settings and should only be managed by top-level admins.
-- =================================================================

ALTER TABLE public.lookup_types ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lookup_types TO admin_pro;
GRANT SELECT ON public.lookup_types TO admin, viewer, cpan_admin, maan_admin, sdh_admin, asset_admin, mng_admin, authenticated;

-- Policy: Pro Admins have full control over lookup types.
DROP POLICY IF EXISTS "policy_admin_pro_all_lookup_types" ON public.lookup_types;
CREATE POLICY "policy_admin_pro_all_lookup_types" ON public.lookup_types
FOR ALL TO admin_pro
USING (is_super_admin() OR public.get_my_role() = 'admin_pro')
WITH CHECK (is_super_admin() OR public.get_my_role() = 'admin_pro');

-- Policy: All other authenticated users can read lookup types.
DROP POLICY IF EXISTS "policy_authenticated_select_lookup_types" ON public.lookup_types;
CREATE POLICY "policy_authenticated_select_lookup_types" ON public.lookup_types
FOR SELECT TO authenticated
USING (true);


-- =================================================================
-- PART 4: GRANTS FOR CORE VIEWS
-- =================================================================
DO $$
BEGIN
  GRANT SELECT ON 
    public.v_lookup_types,
    public.v_maintenance_areas,
    public.v_employee_designations,
    public.v_employees,
    public.v_nodes_complete,
    public.v_ofc_cables_complete
  TO admin, admin_pro, viewer, cpan_admin, maan_admin, sdh_admin, asset_admin, mng_admin, authenticated;
END;
$$;