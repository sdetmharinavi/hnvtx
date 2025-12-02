-- path: data/migrations/03_network_systems/06_rls_and_grants.sql
-- Description: Defines all RLS policies and Grants for the Network Systems module.

-- =================================================================
-- PART 1: GRANTS AND RLS SETUP FOR SYSTEM-SPECIFIC TABLES
-- =================================================================
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'systems', 'system_connections', 'ports_management',
    'ring_based_systems',
    'sdh_connections', 'logical_paths', 'services'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
    
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO admin;', tbl);
    EXECUTE format('GRANT SELECT ON public.%I TO viewer;', tbl);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO cpan_admin, maan_admin, sdh_admin, asset_admin, mng_admin;', tbl);
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated;', tbl);
  END LOOP;
END;
$$;


-- =================================================================
-- PART 2: RLS POLICIES FOR SYSTEM SUB-TABLES
-- =================================================================
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'ports_management', 'ring_based_systems',
    'sdh_connections', 'services'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Allow admin full access" ON public.%I;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Allow authenticated read-access" ON public.%I;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Allow system admins full access" ON public.%I;', tbl);

    EXECUTE format('CREATE POLICY "Allow admin full access" ON public.%I FOR ALL TO admin USING (is_super_admin() OR get_my_role() = ''admin'') WITH CHECK (is_super_admin() OR get_my_role() = ''admin'');', tbl);
    EXECUTE format('CREATE POLICY "Allow authenticated read-access" ON public.%I FOR SELECT TO authenticated USING (true);', tbl);
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
-- PART 5: GRANTS FOR VIEWS
-- =================================================================
DO $$
BEGIN
  GRANT SELECT ON 
    public.v_systems_complete,
    public.v_system_connections_complete,
    public.v_ring_nodes,
    public.v_rings,
    public.v_ofc_connections_complete,
    public.v_ports_management_complete,
    public.v_services -- ADDED
  TO admin, viewer, cpan_admin, maan_admin, sdh_admin, asset_admin, mng_admin, authenticated;

  RAISE NOTICE 'Applied SELECT grants on network system views.';
END;
$$;
