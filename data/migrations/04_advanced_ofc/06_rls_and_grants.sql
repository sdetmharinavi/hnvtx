-- Path: migrations/04_advanced_ofc/05_rls_and_grants.sql
-- Description: RLS policies and Grants for the Advanced OFC (Route Manager) module.

-- =================================================================
-- Step 1: Grant Table-Level Permissions to Roles
-- =================================================================

-- Admin gets full control over all tables.
GRANT ALL ON public.junction_closures TO admin;
GRANT ALL ON public.cable_segments TO admin;
GRANT ALL ON public.fiber_splices TO admin;
-- GRANT ALL ON public.fiber_joints TO admin;
GRANT ALL ON public.logical_fiber_paths TO admin;
-- GRANT ALL ON public.logical_path_segments TO admin;


-- Viewer gets read-only access to all tables and views.
GRANT SELECT ON public.junction_closures TO viewer;
GRANT SELECT ON public.cable_segments TO viewer;
GRANT SELECT ON public.fiber_splices TO viewer;
-- GRANT SELECT ON public.fiber_joints TO viewer;
GRANT SELECT ON public.logical_fiber_paths TO viewer;
-- GRANT SELECT ON public.logical_path_segments TO viewer;

-- View grants for this module's features
GRANT SELECT ON public.v_junction_closures_complete TO viewer, admin;
GRANT SELECT ON public.v_cable_segments_at_jc TO viewer, admin;
-- GRANT SELECT ON public.v_system_ring_paths_detailed TO viewer, admin;
-- GRANT SELECT ON public.v_cable_utilization TO viewer, admin;
-- GRANT SELECT ON public.v_end_to_end_paths TO viewer, admin;
-- GRANT SELECT ON public.v_cable_segments_at_node TO viewer, admin, authenticated;

-- Grant select on dependent tables from other modules for views to work
GRANT SELECT ON public.ofc_cables TO viewer, authenticated;
GRANT SELECT ON public.nodes TO viewer;
GRANT SELECT ON public.junction_closures TO authenticated;
-- GRANT SELECT ON public.v_cable_segments_at_node TO viewer, authenticated;
GRANT SELECT ON public.cable_segments TO authenticated;


-- =================================================================
-- Step 2: Apply RLS Policies to Tables
-- =================================================================
-- Note: A simplified admin/viewer policy is applied here.
-- More complex, row-specific logic would be added if, for example,
-- a 'maan_admin' could only see JCs in their maintenance area.

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'junction_closures', 'cable_segments', 'fiber_splices',
    'logical_fiber_paths'-- , 'fiber_joints', 'logical_path_segments'
  ]
  LOOP
    -- Enable RLS
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);

    -- Drop old policies
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

-- Additional policy: allow authenticated clients to read cable_segments (required for view with security_invoker)
DROP POLICY IF EXISTS policy_authenticated_select_cable_segments ON public.cable_segments;
CREATE POLICY policy_authenticated_select_cable_segments ON public.cable_segments
FOR SELECT
TO authenticated
USING (true);

-- Additional policy: allow authenticated clients to read junction_closures (required for view join)
DROP POLICY IF EXISTS policy_authenticated_select_junction_closures ON public.junction_closures;
CREATE POLICY policy_authenticated_select_junction_closures ON public.junction_closures
FOR SELECT
TO authenticated
USING (true);

-- =================================================================
-- Step 3: Grant EXECUTE on RPC Functions
-- =================================================================
-- This allows any logged-in user to CALL the function.
-- Security inside the function and RLS on tables will enforce permissions.

-- GRANT EXECUTE ON FUNCTION public.manage_splice(p_action TEXT, p_jc_id UUID, p_splice_id UUID, p_incoming_cable_id UUID, p_incoming_fiber_no INT, p_outgoing_cable_id UUID, p_outgoing_fiber_no INT, p_splice_type TEXT) TO authenticated;

-- =================================================================
-- Section 4: View-Level Grants
-- =================================================================
DO $$
BEGIN
  -- GRANT SELECT ON public.v_end_to_end_paths TO admin, viewer;
  -- GRANT SELECT ON public.v_system_ring_paths_detailed TO admin, viewer;
  -- GRANT SELECT ON public.v_cable_utilization TO admin, viewer;

  RAISE NOTICE 'Applied SELECT grants on advanced OFC views.';
END;
$$;