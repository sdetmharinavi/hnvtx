-- path: data/migrations/02_core_infrastructure/06_rls_and_grants.sql
-- Description: Applies a baseline set of RLS policies and grants to core tables. [UPDATED VIEW NAMES]

DO $$
DECLARE
  tbl TEXT;
  admin_role TEXT := 'admin';
  viewer_role TEXT := 'viewer';
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'lookup_types', 'maintenance_areas', 'rings',
    'employee_designations', 'employees', 'nodes',
    'ofc_cables', 'ofc_connections',
    'folders', 'files'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO %I;', tbl, admin_role);
    EXECUTE format('GRANT SELECT ON public.%I TO %I;', tbl, viewer_role);

    EXECUTE format('DROP POLICY IF EXISTS "policy_admin_all_%s" ON public.%I;', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "policy_viewer_select_%s" ON public.%I;', tbl, tbl);

    EXECUTE format($p$
      CREATE POLICY "policy_admin_all_%s" ON public.%I
      FOR ALL TO %I
      USING (is_super_admin() OR public.get_my_role() = %L)
      WITH CHECK (is_super_admin() OR public.get_my_role() = %L);
    $p$, tbl, tbl, admin_role, admin_role, admin_role);

    EXECUTE format($p$
      CREATE POLICY "policy_viewer_select_%s" ON public.%I
      FOR SELECT TO %I
      USING (public.get_my_role() = %L);
    $p$, tbl, tbl, viewer_role, viewer_role);

    RAISE NOTICE 'Applied baseline admin/viewer RLS policies to %', tbl;
  END LOOP;
END;
$$;


DO $$
BEGIN
  EXECUTE 'GRANT SELECT ON public.nodes TO cpan_admin, maan_admin, sdh_admin, vmux_admin, mng_admin;';
  EXECUTE 'GRANT SELECT ON public.maintenance_areas TO cpan_admin, maan_admin, sdh_admin, vmux_admin, mng_admin;';
  EXECUTE 'GRANT SELECT ON public.lookup_types TO cpan_admin, maan_admin, sdh_admin, vmux_admin, mng_admin;';
  EXECUTE 'GRANT SELECT ON public.ofc_cables TO cpan_admin, maan_admin, sdh_admin, vmux_admin, mng_admin;';
  EXECUTE 'GRANT SELECT ON public.ofc_connections TO cpan_admin, maan_admin, sdh_admin, vmux_admin, mng_admin;';
  RAISE NOTICE 'Granted SELECT on core tables to specific admin roles.';
END;
$$;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['nodes', 'maintenance_areas', 'lookup_types', 'ofc_cables', 'ofc_connections']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "policy_system_admins_select_%s" ON public.%I;', tbl, tbl);
    EXECUTE format($p$
      CREATE POLICY "policy_system_admins_select_%s" ON public.%I
      FOR SELECT TO cpan_admin, maan_admin, sdh_admin, vmux_admin, mng_admin
      USING (
        get_my_role() IN ('cpan_admin', 'maan_admin', 'sdh_admin', 'vmux_admin', 'mng_admin')
      );
    $p$, tbl, tbl);
    RAISE NOTICE 'Applied system-admin SELECT RLS policy to %', tbl;
  END LOOP;
END;
$$;

-- CORRECTED SECTION: Grants now reference the renamed views.
DO $$
BEGIN
  GRANT SELECT ON public.v_lookup_types TO admin, viewer, cpan_admin, maan_admin, sdh_admin, vmux_admin, mng_admin;
  GRANT SELECT ON public.v_maintenance_areas TO admin, viewer, cpan_admin, maan_admin, sdh_admin, vmux_admin, mng_admin;
  GRANT SELECT ON public.v_employee_designations TO admin, viewer;
  GRANT SELECT ON public.v_employees TO admin, viewer;
  GRANT SELECT ON public.v_nodes_complete TO admin, viewer, cpan_admin, maan_admin, sdh_admin, vmux_admin, mng_admin;
  GRANT SELECT ON public.v_ofc_cables_complete TO admin, viewer, cpan_admin, maan_admin, sdh_admin, vmux_admin, mng_admin;

  RAISE NOTICE 'Applied SELECT grants on core infrastructure views for ALL relevant roles.';
END;
$$;