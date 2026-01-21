-- path: data/migrations/03_network_systems/07_rls_and_grants.sql
-- Description: Defines all RLS policies and Grants for the Network Systems module. [REVISED & CONSOLIDATED]

-- =================================================================
-- PART 1: GRANTS AND RLS SETUP FOR ALL MODULE TABLES
-- This consolidated loop handles all tables in the network systems module.
-- =================================================================
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'systems', 'system_connections', 'ports_management',
    'ring_based_systems', 'sdh_connections', 
    'logical_paths', 'services'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
    
    -- Grant broad table-level permissions. RLS policies will enforce the fine-grained access.
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO admin, admin_pro;', tbl);
    EXECUTE format('GRANT SELECT ON public.%I TO viewer;', tbl);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO cpan_admin, maan_admin, sdh_admin, asset_admin, mng_admin;', tbl);
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated;', tbl);
  END LOOP;
END;
$$;


-- =================================================================
-- PART 2: RLS POLICIES FOR GENERIC & SUB-TABLES
-- These tables don't need type-specific RLS and can be managed by any system admin.
-- =================================================================
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'ports_management', 'ring_based_systems',
    'sdh_connections', 'logical_paths', 'services'
  ]
  LOOP
    -- Policy 1: Admins (regular and pro) have full access.
    EXECUTE format('DROP POLICY IF EXISTS "policy_admin_all_%s" ON public.%I;', tbl, tbl);
    EXECUTE format($p$
      CREATE POLICY "policy_admin_all_%s" ON public.%I
      FOR ALL TO admin, admin_pro
      USING (is_super_admin() OR public.get_my_role() IN ('admin', 'admin_pro'))
      WITH CHECK (is_super_admin() OR public.get_my_role() IN ('admin', 'admin_pro'));
    $p$, tbl, tbl);

    -- Policy 2: Authenticated users can read (for dropdowns, general info).
    EXECUTE format('DROP POLICY IF EXISTS "policy_authenticated_select_%s" ON public.%I;', tbl, tbl);
    EXECUTE format($p$
      CREATE POLICY "policy_authenticated_select_%s" ON public.%I
      FOR SELECT TO authenticated
      USING (true);
    $p$, tbl, tbl);

    -- Policy 3: System-specific admins have full control over these related tables.
    EXECUTE format('DROP POLICY IF EXISTS "policy_system_admins_all_%s" ON public.%I;', tbl, tbl);
    EXECUTE format($p$
      CREATE POLICY "policy_system_admins_all_%s" ON public.%I
      FOR ALL TO cpan_admin, maan_admin, sdh_admin, asset_admin, mng_admin
      USING (public.get_my_role() IN ('cpan_admin', 'maan_admin', 'sdh_admin', 'asset_admin', 'mng_admin'))
      WITH CHECK (public.get_my_role() IN ('cpan_admin', 'maan_admin', 'sdh_admin', 'asset_admin', 'mng_admin'));
    $p$, tbl, tbl);
  END LOOP;
END;
$$;


-- =================================================================
-- PART 3: TYPE-SPECIFIC RLS POLICIES FOR 'systems' and 'system_connections'
-- These policies are the core of this module's security, restricting access based on system type.
-- =================================================================
DO $$
BEGIN
  -- Policies for 'systems' table
  DROP POLICY IF EXISTS "policy_admin_all_systems" ON public.systems;
  DROP POLICY IF EXISTS "policy_authenticated_select_systems" ON public.systems;
  DROP POLICY IF EXISTS "policy_system_type_access_systems" ON public.systems;

  CREATE POLICY "policy_admin_all_systems" ON public.systems FOR ALL TO admin, admin_pro USING (is_super_admin() OR public.get_my_role() IN ('admin', 'admin_pro')) WITH CHECK (is_super_admin() OR public.get_my_role() IN ('admin', 'admin_pro'));
  CREATE POLICY "policy_authenticated_select_systems" ON public.systems FOR SELECT TO authenticated USING (true);
  
  -- This policy allows users with roles like 'cpan_admin' to manage systems where the type is 'CPAN'.
  CREATE POLICY "policy_system_type_access_systems" ON public.systems
  FOR ALL TO cpan_admin, maan_admin, sdh_admin, asset_admin, mng_admin
  USING (
    systems.system_type_id IN (
      SELECT lt.id FROM public.lookup_types lt
      WHERE lt.category = 'SYSTEM_TYPES' AND (
        (public.get_my_role() = 'cpan_admin' AND lt.name = 'CPAN') OR
        (public.get_my_role() = 'maan_admin' AND lt.name = 'MAAN') OR
        (public.get_my_role() = 'sdh_admin' AND lt.name IN ('Plesiochronous Digital Hierarchy', 'Synchronous Digital Hierarchy', 'Next Generation SDH')) OR -- [FIX] Allow all SDH variants
        (public.get_my_role() = 'mng_admin' AND lt.name = 'MNGPAN')
      )
    )
  ) WITH CHECK ( -- The WITH CHECK clause is identical, ensuring users can't change a system's type to one they don't manage.
    systems.system_type_id IN (
      SELECT lt.id FROM public.lookup_types lt
      WHERE lt.category = 'SYSTEM_TYPES' AND (
        (public.get_my_role() = 'cpan_admin' AND lt.name = 'CPAN') OR
        (public.get_my_role() = 'maan_admin' AND lt.name = 'MAAN') OR
        (public.get_my_role() = 'sdh_admin' AND lt.name IN ('Plesiochronous Digital Hierarchy', 'Synchronous Digital Hierarchy', 'Next Generation SDH')) OR
        (public.get_my_role() = 'mng_admin' AND lt.name = 'MNGPAN')
      )
    )
  );

  -- Policies for 'system_connections' table
  DROP POLICY IF EXISTS "policy_admin_all_system_connections" ON public.system_connections;
  DROP POLICY IF EXISTS "policy_authenticated_select_system_connections" ON public.system_connections;
  DROP POLICY IF EXISTS "policy_system_type_access_system_connections" ON public.system_connections;

  CREATE POLICY "policy_admin_all_system_connections" ON public.system_connections FOR ALL TO admin, admin_pro USING (is_super_admin() OR public.get_my_role() IN ('admin', 'admin_pro')) WITH CHECK (is_super_admin() OR public.get_my_role() IN ('admin', 'admin_pro'));
  CREATE POLICY "policy_authenticated_select_system_connections" ON public.system_connections FOR SELECT TO authenticated USING (true);
  
  -- This policy checks the type of the PARENT system to determine access to the connection.
  CREATE POLICY "policy_system_type_access_system_connections" ON public.system_connections
  FOR ALL TO cpan_admin, maan_admin, sdh_admin, asset_admin, mng_admin
  USING (
    EXISTS (
      SELECT 1 FROM public.systems s
      JOIN public.lookup_types lt ON s.system_type_id = lt.id
      WHERE s.id = system_connections.system_id 
      AND lt.category = 'SYSTEM_TYPES' AND (
          (public.get_my_role() = 'cpan_admin' AND lt.name = 'CPAN') OR
          (public.get_my_role() = 'maan_admin' AND lt.name = 'MAAN') OR
          (public.get_my_role() = 'sdh_admin' AND lt.name IN ('Plesiochronous Digital Hierarchy', 'Synchronous Digital Hierarchy', 'Next Generation SDH')) OR
          (public.get_my_role() = 'mng_admin' AND lt.name = 'MNGPAN')
      )
    )
  ) WITH CHECK ( -- The WITH CHECK is identical, ensuring a connection cannot be re-assigned to a system of a type the user cannot manage.
    EXISTS (
      SELECT 1 FROM public.systems s
      JOIN public.lookup_types lt ON s.system_type_id = lt.id
      WHERE s.id = system_connections.system_id 
      AND lt.category = 'SYSTEM_TYPES' AND (
          (public.get_my_role() = 'cpan_admin' AND lt.name = 'CPAN') OR
          (public.get_my_role() = 'maan_admin' AND lt.name = 'MAAN') OR
          (public.get_my_role() = 'sdh_admin' AND lt.name IN ('Plesiochronous Digital Hierarchy', 'Synchronous Digital Hierarchy', 'Next Generation SDH')) OR
          (public.get_my_role() = 'mng_admin' AND lt.name = 'MNGPAN')
      )
    )
  );
END;
$$;


-- =================================================================
-- PART 4: GRANTS FOR VIEWS
-- =================================================================
DO $$
BEGIN
  -- [CHANGED] Added admin_pro to the grant list.
  GRANT SELECT ON 
    public.v_systems_complete,
    public.v_system_connections_complete,
    public.v_ring_nodes,
    public.v_rings,
    public.v_ports_management_complete,
    public.v_services
  TO admin, admin_pro, viewer, cpan_admin, sdh_admin, asset_admin, mng_admin, authenticated;
END;
$$;