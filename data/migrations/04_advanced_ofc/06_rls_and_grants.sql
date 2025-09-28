-- Path: migrations/04_advanced_ofc/06_rls_and_grants.sql
-- Description: RLS policies and Grants for the Advanced OFC (Route Manager) module.

-- =================================================================
-- Step 1: Grant Table-Level Permissions to Roles
-- =================================================================
GRANT ALL ON public.junction_closures TO admin;
GRANT ALL ON public.cable_segments TO admin;
GRANT ALL ON public.fiber_splices TO admin;
GRANT ALL ON public.logical_fiber_paths TO admin;
GRANT ALL ON public.logical_path_segments TO admin; -- Added missing table grant

GRANT SELECT ON public.junction_closures TO viewer;
GRANT SELECT ON public.cable_segments TO viewer;
GRANT SELECT ON public.fiber_splices TO viewer;
GRANT SELECT ON public.logical_fiber_paths TO viewer;
GRANT SELECT ON public.logical_path_segments TO viewer; -- Added missing table grant

-- Grant select on dependent tables from other modules for views to work
GRANT SELECT ON public.ofc_cables TO viewer, authenticated;
GRANT SELECT ON public.nodes TO viewer;
GRANT SELECT ON public.junction_closures TO authenticated;
GRANT SELECT ON public.cable_segments TO authenticated;

-- =================================================================
-- Step 2: Apply RLS Policies to Tables
-- =================================================================
DO $$
DECLARE
  tbl TEXT;
BEGIN
  -- CORRECTED: Uncommented logical_path_segments
  FOREACH tbl IN ARRAY ARRAY[
    'junction_closures', 'cable_segments', 'fiber_splices',
    'logical_fiber_paths', 'logical_path_segments'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "policy_admin_all_%s" ON public.%I;', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "policy_viewer_select_%s" ON public.%I;', tbl, tbl);

    -- Admin Policy
    EXECUTE format($p$
      CREATE POLICY "policy_admin_all_%s" ON public.%I FOR ALL TO admin
      USING (is_super_admin() OR get_my_role() = 'admin')
      WITH CHECK (is_super_admin() OR get_my_role() = 'admin');
    $p$, tbl, tbl);

    -- Viewer Policy
    EXECUTE format($p$
      CREATE POLICY "policy_viewer_select_%s" ON public.%I FOR SELECT TO viewer
      USING (get_my_role() = 'viewer' OR is_super_admin() OR get_my_role() = 'admin');
    $p$, tbl, tbl);
  END LOOP;
END;
$$;

DROP POLICY IF EXISTS policy_authenticated_select_cable_segments ON public.cable_segments;
CREATE POLICY policy_authenticated_select_cable_segments ON public.cable_segments
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS policy_authenticated_select_junction_closures ON public.junction_closures;
CREATE POLICY policy_authenticated_select_junction_closures ON public.junction_closures
FOR SELECT TO authenticated USING (true);

-- =================================================================
-- Step 3: View-Level Grants [CORRECTED]
-- =================================================================
DO $$
BEGIN
  -- CORRECTED: Added grants for specific admin roles to all relevant views in this module.
  GRANT SELECT ON public.v_junction_closures_complete TO admin, viewer, cpan_admin, maan_admin, sdh_admin, vmux_admin, mng_admin;
  GRANT SELECT ON public.v_cable_segments_at_jc TO admin, viewer, cpan_admin, maan_admin, sdh_admin, vmux_admin, mng_admin;
  GRANT SELECT ON public.v_system_ring_paths_detailed TO admin, viewer, cpan_admin, maan_admin, sdh_admin, vmux_admin, mng_admin;
  GRANT SELECT ON public.v_cable_utilization TO admin, viewer, cpan_admin, maan_admin, sdh_admin, vmux_admin, mng_admin;
  GRANT SELECT ON public.v_end_to_end_paths TO admin, viewer, cpan_admin, maan_admin, sdh_admin, vmux_admin, mng_admin;
  
  RAISE NOTICE 'Applied SELECT grants on advanced OFC views for ALL relevant roles.';
END;
$$;