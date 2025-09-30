-- path: data/migrations/03_network_systems/05_rls_and_grants.sql
-- Description: Defines all RLS policies and Grants for the Network Systems module. [UPDATED VIEW NAMES]

-- =================================================================
-- PART 1: GENERIC GRANTS AND RLS SETUP FOR ALL SYSTEM TABLES
-- =================================================================
DO $$
DECLARE
  tbl TEXT;
BEGIN
  -- List all tables related to network systems
  FOREACH tbl IN ARRAY ARRAY[
    'systems', 'system_connections', 'management_ports',
    'ring_based_systems', 'sfp_based_connections',
    'sdh_systems', 'sdh_connections', 'sdh_node_associations',
    'vmux_systems', 'vmux_connections'
  ]
  LOOP
    -- Enable RLS and set table-level grants for all relevant roles
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO admin;', tbl);
    EXECUTE format('GRANT SELECT ON public.%I TO viewer;', tbl);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO cpan_admin;', tbl);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO maan_admin;', tbl);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO sdh_admin;', tbl);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO vmux_admin;', tbl);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO mng_admin;', tbl);
  END LOOP;
END;
$$;


-- =================================================================
-- PART 2: COMPLEX POLICIES FOR GENERIC TABLES (systems, system_connections)
-- =================================================================

-- Policies for the 'systems' table
DO $$
BEGIN
  -- Clean up old policies for idempotency
  DROP POLICY IF EXISTS "Allow full access based on system type" ON public.systems;
  DROP POLICY IF EXISTS "Allow viewer read-access" ON public.systems;
  DROP POLICY IF EXISTS "Allow admin full access" ON public.systems;

  -- Viewer can see all systems
  CREATE POLICY "Allow viewer read-access" ON public.systems FOR SELECT TO viewer USING (true);
  -- Admin/Super-Admin can do anything
  CREATE POLICY "Allow admin full access" ON public.systems FOR ALL TO admin USING (is_super_admin() OR get_my_role() = 'admin') WITH CHECK (is_super_admin() OR get_my_role() = 'admin');

  -- System-specific admins can access rows matching their designated system type
  CREATE POLICY "Allow full access based on system type" ON public.systems
  FOR ALL TO cpan_admin, maan_admin, sdh_admin, vmux_admin, mng_admin
  USING (
    EXISTS (
        SELECT 1 FROM public.lookup_types lt
        WHERE lt.id = systems.system_type_id AND lt.category = 'SYSTEM' AND (
            (public.get_my_role() = 'cpan_admin' AND lt.name = 'CPAN') OR
            (public.get_my_role() = 'maan_admin' AND lt.name = 'MAAN') OR
            (public.get_my_role() = 'sdh_admin' AND lt.name = 'SDH') OR
            (public.get_my_role() = 'vmux_admin' AND lt.name = 'VMUX') OR
            (public.get_my_role() = 'mng_admin' AND lt.name = 'MNGPAN')
        )
    )
  )
  WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.lookup_types lt
        WHERE lt.id = systems.system_type_id AND lt.category = 'SYSTEM' AND (
            (public.get_my_role() = 'cpan_admin' AND lt.name = 'CPAN') OR
            (public.get_my_role() = 'maan_admin' AND lt.name = 'MAAN') OR
            (public.get_my_role() = 'sdh_admin' AND lt.name = 'SDH') OR
            (public.get_my_role() = 'vmux_admin' AND lt.name = 'VMUX') OR
            (public.get_my_role() = 'mng_admin' AND lt.name = 'MNGPAN')
        )
    )
  );
END;
$$;


-- Policies for the 'system_connections' table
DO $$
BEGIN
  DROP POLICY IF EXISTS "Allow full access based on parent system type" ON public.system_connections;
  DROP POLICY IF EXISTS "Allow viewer read-access" ON public.system_connections;
  DROP POLICY IF EXISTS "Allow admin full access" ON public.system_connections;

  CREATE POLICY "Allow viewer read-access" ON public.system_connections FOR SELECT TO viewer USING (true);
  CREATE POLICY "Allow admin full access" ON public.system_connections FOR ALL TO admin USING (is_super_admin() OR get_my_role() = 'admin') WITH CHECK (is_super_admin() OR get_my_role() = 'admin');

  -- System-specific admins can access connections whose parent system matches their type.
  CREATE POLICY "Allow full access based on parent system type" ON public.system_connections
  FOR ALL TO cpan_admin, maan_admin, sdh_admin, vmux_admin, mng_admin
  USING (
    EXISTS (
      SELECT 1 FROM public.systems s
      JOIN public.lookup_types lt ON s.system_type_id = lt.id
      WHERE s.id = system_connections.system_id AND lt.category = 'SYSTEM' AND (
        (public.get_my_role() = 'cpan_admin' AND lt.name = 'CPAN') OR
        (public.get_my_role() = 'maan_admin' AND lt.name = 'MAAN') OR
        (public.get_my_role() = 'sdh_admin' AND lt.name = 'SDH') OR
        (public.get_my_role() = 'vmux_admin' AND lt.name = 'VMUX') OR
        (public.get_my_role() = 'mng_admin' AND lt.name = 'MNGPAN')
      )
    )
  )
  WITH CHECK ( -- Re-use the same logic for INSERTs and UPDATEs
    EXISTS (
      SELECT 1 FROM public.systems s
      JOIN public.lookup_types lt ON s.system_type_id = lt.id
      WHERE s.id = system_connections.system_id AND lt.category = 'SYSTEM' AND (
        (public.get_my_role() = 'cpan_admin' AND lt.name = 'CPAN') OR
        (public.get_my_role() = 'maan_admin' AND lt.name = 'MAAN') OR
        (public.get_my_role() = 'sdh_admin' AND lt.name = 'SDH') OR
        (public.get_my_role() = 'vmux_admin' AND lt.name = 'VMUX') OR
        (public.get_my_role() = 'mng_admin' AND lt.name = 'MNGPAN')
      )
    )
  );
END;
$$;


-- =================================================================
-- PART 3: AUTOMATED POLICIES FOR SYSTEM-SPECIFIC SUB-TABLES
-- =================================================================
DO $$
DECLARE
    -- Maps tables to their specific admin roles
    mappings TEXT[][] := ARRAY[
        ['ring_based_systems', 'cpan_admin'], ['ring_based_systems', 'maan_admin'],
        ['sfp_based_connections', 'cpan_admin'], ['sfp_based_connections', 'maan_admin'],
        ['sdh_systems', 'sdh_admin'], ['sdh_connections', 'sdh_admin'],
        ['sdh_node_associations', 'sdh_admin'], ['vmux_systems', 'vmux_admin'],
        ['vmux_connections', 'vmux_admin']
    ];
    tbl TEXT;
    specific_role TEXT;
    i INT;
BEGIN
    FOR i IN 1..array_length(mappings, 1) LOOP
        tbl := mappings[i][1];
        specific_role := mappings[i][2];

        -- Clean up old policies for idempotency
        EXECUTE format('DROP POLICY IF EXISTS "Allow viewer read-access" ON public.%I;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Allow admin full access" ON public.%I;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Allow %s full access" ON public.%I;', specific_role, tbl);

        -- Viewer can read
        EXECUTE format('CREATE POLICY "Allow viewer read-access" ON public.%I FOR SELECT TO viewer USING (true);', tbl);
        -- Admin/Super-Admin can do everything
        EXECUTE format('CREATE POLICY "Allow admin full access" ON public.%I FOR ALL TO admin USING (is_super_admin() OR get_my_role() = ''admin'') WITH CHECK (is_super_admin() OR get_my_role() = ''admin'');', tbl);
        -- The specific system admin can do everything
        EXECUTE format($p$
            CREATE POLICY "Allow %s full access" ON public.%I
            FOR ALL TO %I
            USING (public.get_my_role() = %L)
            WITH CHECK (public.get_my_role() = %L);
        $p$, specific_role, tbl, specific_role, specific_role, specific_role);

        RAISE NOTICE 'Applied specific policies for role % on table %', specific_role, tbl;
    END LOOP;
END;
$$;

-- =================================================================
-- Section 4: View-Level Grants [UPDATED VIEW NAMES]
-- =================================================================
DO $$
BEGIN
  GRANT SELECT ON public.v_systems_complete TO admin, viewer, cpan_admin, maan_admin, sdh_admin, vmux_admin, mng_admin;
  GRANT SELECT ON public.v_system_connections_complete TO admin, viewer, cpan_admin, maan_admin, sdh_admin, vmux_admin, mng_admin;
  GRANT SELECT ON public.v_ring_nodes TO admin, viewer, cpan_admin, maan_admin, sdh_admin, vmux_admin, mng_admin;
  GRANT SELECT ON public.v_rings TO admin, viewer, cpan_admin, maan_admin, sdh_admin, vmux_admin, mng_admin;
  GRANT SELECT ON public.v_ofc_connections_complete TO admin, viewer, cpan_admin, maan_admin, sdh_admin, vmux_admin, mng_admin;

  RAISE NOTICE 'Applied SELECT grants on network system views.';
END;
$$;