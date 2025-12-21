-- path: migrations/04_advanced_ofc/06_rls_and_grants.sql
-- Description: RLS policies and Grants for the Advanced OFC (Route Manager) module. [REVISED FOR ADMIN_PRO]

-- =================================================================
-- Step 1: Grant Table-Level Permissions to Roles
-- =================================================================

-- Grant full control to top-level administrators
GRANT ALL ON TABLE
    public.junction_closures,
    public.cable_segments,
    public.fiber_splices,
    public.logical_fiber_paths,
    public.logical_path_segments
TO admin, admin_pro, ofc_admin;

-- Grant read-only access to viewer and system-specific admin roles
GRANT SELECT ON TABLE
    public.junction_closures,
    public.cable_segments,
    public.fiber_splices,
    public.logical_fiber_paths,
    public.logical_path_segments
TO viewer, cpan_admin, maan_admin, sdh_admin, asset_admin, mng_admin;

-- [CHANGED] Grant explicit SELECT on dependent tables to all relevant roles for view integrity
GRANT SELECT ON TABLE
    public.ofc_cables,
    public.nodes
TO admin, admin_pro, ofc_admin, viewer, cpan_admin, maan_admin, sdh_admin, asset_admin, mng_admin;
    
-- Grant SELECT to the base 'authenticated' role so SECURITY INVOKER views and functions can access the tables.
GRANT SELECT ON TABLE
    public.junction_closures,
    public.cable_segments
TO authenticated;

-- =================================================================
-- Step 2: Apply RLS Policies to Tables
-- =================================================================
DO $$
DECLARE
  tbl TEXT;
BEGIN
  -- This loop applies a standard set of policies to all tables in this module.
  FOREACH tbl IN ARRAY ARRAY[
    'junction_closures', 'cable_segments', 'fiber_splices',
    'logical_fiber_paths', 'logical_path_segments'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
    
    -- Policy 1: Admin & Pro Admin Policy (Full Access)
    EXECUTE format('DROP POLICY IF EXISTS "policy_admin_all_%s" ON public.%I;', tbl, tbl);
    EXECUTE format($p$
      CREATE POLICY "policy_admin_all_%s" ON public.%I FOR ALL
      TO admin, admin_pro, ofc_admin
      USING (is_super_admin() OR public.get_my_role() IN ('admin', 'admin_pro', 'ofc_admin'))
      WITH CHECK (is_super_admin() OR public.get_my_role() IN ('admin', 'admin_pro', 'ofc_admin'));
    $p$, tbl, tbl);

    -- Policy 2: Read-Only Access for other roles
    -- [CHANGED] This policy now clearly grants SELECT access to any authenticated user.
    -- This is safe for this module as OFC path data is not user-specific.
    EXECUTE format('DROP POLICY IF EXISTS "policy_authenticated_select_%s" ON public.%I;', tbl, tbl);
    EXECUTE format($p$
      CREATE POLICY "policy_authenticated_select_%s" ON public.%I FOR SELECT
      TO authenticated
      USING (true);
    $p$, tbl, tbl);
  END LOOP;
END;
$$;


-- =================================================================
-- Step 3: View-Level Grants
-- =================================================================
DO $$
BEGIN
  -- [CHANGED] Consolidated all view grants into a single, clear statement.
  -- Grants SELECT on all views in this module to all roles that should have read access.
  GRANT SELECT ON 
    public.v_junction_closures_complete,
    public.v_cable_segments_at_jc,
    public.v_cable_utilization,
    public.v_end_to_end_paths,
    public.v_ofc_connections_complete
  TO admin, admin_pro, ofc_admin, viewer, cpan_admin, maan_admin, sdh_admin, asset_admin, mng_admin;
END;
$$;