-- path: data/migrations/03_network_systems/06_rls_and_grants.sql
-- Description: Defines all RLS policies and Grants for the Network Systems module. [FINAL CORRECTION for system sub-tables RLS]

-- =================================================================
-- PART 1: GRANTS AND RLS SETUP FOR SYSTEM-SPECIFIC TABLES
-- =================================================================
DO $$
DECLARE
  tbl TEXT;
BEGIN
  -- List all tables related to network systems
  FOREACH tbl IN ARRAY ARRAY[
    'systems', 'system_connections', 'ports_management',
    'ring_based_systems',
    'sdh_connections', 'logical_paths'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
    
    -- Grant permissions to specific roles
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO admin;', tbl);
    EXECUTE format('GRANT SELECT ON public.%I TO viewer;', tbl);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO cpan_admin, maan_admin, sdh_admin, asset_admin, mng_admin;', tbl);
    
    -- Grant SELECT to the base authenticated role so SECURITY INVOKER functions can access the tables.
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated;', tbl);
  END LOOP;
END;
$$;


-- =================================================================
-- PART 2: THE FIX - RLS POLICIES FOR SYSTEM SUB-TABLES
-- =================================================================
-- This was the missing piece. This policy grants write access to specialized admins
-- on tables like ports_management, sdh_connections, etc.
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'ports_management', 'ring_based_systems',
    'sdh_connections'
  ]
  LOOP
    -- Drop existing policies for idempotency, now correctly targeting the loop variable
    EXECUTE format('DROP POLICY IF EXISTS "Allow admin full access" ON public.%I;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Allow authenticated read-access" ON public.%I;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Allow system admins full access" ON public.%I;', tbl);

    -- Policy 1: Admins and Super-Admins have unrestricted access.
    EXECUTE format('CREATE POLICY "Allow admin full access" ON public.%I FOR ALL TO admin USING (is_super_admin() OR get_my_role() = ''admin'') WITH CHECK (is_super_admin() OR get_my_role() = ''admin'');', tbl);

    -- Policy 2: All authenticated users can read (for views and dropdowns).
    EXECUTE format('CREATE POLICY "Allow authenticated read-access" ON public.%I FOR SELECT TO authenticated USING (true);', tbl);

    -- Policy 3: Specialized system admins have full access.
    EXECUTE format('CREATE POLICY "Allow system admins full access" ON public.%I FOR ALL TO cpan_admin, maan_admin, sdh_admin, asset_admin, mng_admin USING (get_my_role() IN (''cpan_admin'', ''maan_admin'', ''sdh_admin'', ''asset_admin'', ''mng_admin'')) WITH CHECK (get_my_role() IN (''cpan_admin'', ''maan_admin'', ''sdh_admin'', ''asset_admin'', ''mng_admin''));', tbl);
  END LOOP;
END;
$$;


-- =================================================================
-- PART 3: RLS POLICIES FOR GENERIC TABLES (systems, system_connections)
-- =================================================================
DO $$
BEGIN
  -- Policies for 'systems' table
  DROP POLICY IF EXISTS "Allow authenticated read-access" ON public.systems;
  DROP POLICY IF EXISTS "Allow admin full access" ON public.systems;
  DROP POLICY IF EXISTS "Allow full access based on system type" ON public.systems;

  CREATE POLICY "Allow authenticated read-access" ON public.systems FOR SELECT TO authenticated USING (true);
  CREATE POLICY "Allow admin full access" ON public.systems FOR ALL TO admin USING (is_super_admin() OR get_my_role() = 'admin') WITH CHECK (is_super_admin() OR get_my_role() = 'admin');

  CREATE POLICY "Allow full access based on system type" ON public.systems
  FOR ALL TO cpan_admin, maan_admin, sdh_admin, asset_admin, mng_admin
  USING (
    systems.system_type_id IN (
      SELECT lt.id FROM public.lookup_types lt
      WHERE lt.category = 'SYSTEM_TYPES' AND (
        (public.get_my_role() = 'cpan_admin' AND lt.name = 'CPAN') OR
        (public.get_my_role() = 'maan_admin' AND lt.name = 'MAAN') OR
        (public.get_my_role() = 'sdh_admin' AND lt.name = 'SDH') OR
        (public.get_my_role() = 'mng_admin' AND lt.name = 'MNGPAN')
      )
    )
  ) WITH CHECK (
    systems.system_type_id IN (
      SELECT lt.id FROM public.lookup_types lt
      WHERE lt.category = 'SYSTEM_TYPES' AND (
        (public.get_my_role() = 'cpan_admin' AND lt.name = 'CPAN') OR
        (public.get_my_role() = 'maan_admin' AND lt.name = 'MAAN') OR
        (public.get_my_role() = 'sdh_admin' AND lt.name = 'SDH') OR
        (public.get_my_role() = 'mng_admin' AND lt.name = 'MNGPAN')
      )
    )
  );

  -- Policies for 'system_connections' table
  DROP POLICY IF EXISTS "Allow authenticated read-access" ON public.system_connections;
  DROP POLICY IF EXISTS "Allow admin full access" ON public.system_connections;
  DROP POLICY IF EXISTS "Allow full access based on parent system type" ON public.system_connections;

  CREATE POLICY "Allow authenticated read-access" ON public.system_connections FOR SELECT TO authenticated USING (true);
  CREATE POLICY "Allow admin full access" ON public.system_connections FOR ALL TO admin USING (is_super_admin() OR get_my_role() = 'admin') WITH CHECK (is_super_admin() OR get_my_role() = 'admin');

  CREATE POLICY "Allow full access based on parent system type" ON public.system_connections
  FOR ALL TO cpan_admin, maan_admin, sdh_admin, asset_admin, mng_admin
  USING (
    EXISTS (
      SELECT 1 FROM public.systems s
      JOIN public.lookup_types lt ON s.system_type_id = lt.id
      WHERE s.id = system_connections.system_id 
      AND lt.category = 'SYSTEM_TYPES' AND (
          (public.get_my_role() = 'cpan_admin' AND lt.name = 'CPAN') OR
          (public.get_my_role() = 'maan_admin' AND lt.name = 'MAAN') OR
          (public.get_my_role() = 'sdh_admin' AND lt.name = 'SDH') OR
          (public.get_my_role() = 'mng_admin' AND lt.name = 'MNGPAN')
      )
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.systems s
      JOIN public.lookup_types lt ON s.system_type_id = lt.id
      WHERE s.id = system_connections.system_id 
      AND lt.category = 'SYSTEM_TYPES' AND (
          (public.get_my_role() = 'cpan_admin' AND lt.name = 'CPAN') OR
          (public.get_my_role() = 'maan_admin' AND lt.name = 'MAAN') OR
          (public.get_my_role() = 'sdh_admin' AND lt.name = 'SDH') OR
          (public.get_my_role() = 'mng_admin' AND lt.name = 'MNGPAN')
      )
    )
  );
END;
$$;

-- =================================================================
-- PART 4: This is now a duplicate of PART 2 and is no longer needed.
-- =================================================================


-- =================================================================
-- PART 5: GRANTS FOR VIEWS
-- =================================================================
DO $$
BEGIN
  GRANT SELECT ON 
    public.v_systems_complete,
    public.v_system_connections_complete,
    public.v_ring_nodes,
    public.v_rings,
    public.v_ofc_connections_complete
  TO admin, viewer, cpan_admin, maan_admin, sdh_admin, asset_admin, mng_admin, authenticated;

  RAISE NOTICE 'Applied SELECT grants on network system views.';
END;
$$;