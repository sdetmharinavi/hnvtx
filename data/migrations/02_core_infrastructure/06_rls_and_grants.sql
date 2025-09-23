-- Path: migrations/02_core_infrastructure/06_rls_and_grants.sql
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

    RAISE NOTICE 'Applied baseline admin/viewer RLS policies to %', tbl;
  END LOOP;
END;
$$;


-- =================================================================
-- Section 2: SELECT Grants and Policies for Specific Admin Roles
-- =================================================================

-- START OF FIX --
-- This entire section is now wrapped in DO blocks to allow for procedural logic.
DO $$
BEGIN
  -- First, grant the basic ability to SELECT from these tables to the specific roles.
  -- These GRANTs are now executed dynamically.
  EXECUTE 'GRANT SELECT ON public.nodes TO cpan_admin, maan_admin, sdh_admin, vmux_admin, mng_admin;';
  EXECUTE 'GRANT SELECT ON public.maintenance_areas TO cpan_admin, maan_admin, sdh_admin, vmux_admin, mng_admin;';
  EXECUTE 'GRANT SELECT ON public.lookup_types TO cpan_admin, maan_admin, sdh_admin, vmux_admin, mng_admin;';
  EXECUTE 'GRANT SELECT ON public.ofc_cables TO cpan_admin, maan_admin, sdh_admin, vmux_admin, mng_admin;';
  EXECUTE 'GRANT SELECT ON public.ofc_connections TO cpan_admin, maan_admin, sdh_admin, vmux_admin, mng_admin;';

  RAISE NOTICE 'Granted SELECT on core tables to specific admin roles.';
END;
$$;
-- END OF FIX --


DO $$
DECLARE
  tbl TEXT;
BEGIN
  -- Second, add a policy that allows these roles to see the data.
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

-- =================================================================
-- Section 3: View-Level Grants [NEW AND CRITICAL FIX]
-- =================================================================
-- Grants SELECT permission on the views defined in this module to the relevant roles.
-- This is separate from RLS on the underlying tables. A user needs both.

DO $$
BEGIN
  GRANT SELECT ON public.v_lookup_types_with_count TO admin, viewer;
  GRANT SELECT ON public.v_maintenance_areas_with_count TO admin, viewer;
  GRANT SELECT ON public.v_employee_designations_with_count TO admin, viewer;
  GRANT SELECT ON public.v_employees_with_count TO admin, viewer;
  GRANT SELECT ON public.v_rings_with_count TO admin, viewer;
  GRANT SELECT ON public.v_nodes_complete TO admin, viewer;
  GRANT SELECT ON public.v_ofc_cables_complete TO admin, viewer;

  RAISE NOTICE 'Applied SELECT grants on core infrastructure views.';
END;
$$;