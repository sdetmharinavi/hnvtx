-- REFACTORED: This script defines all security (Grants and RLS Policies) for the entire Network Systems module.
-- It is structured to reduce boilerplate and improve maintainability.

-- =================================================================
-- PART 1: GRANTS AND RLS SETUP FOR ALL SYSTEM TABLES
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
    -- Step 1: Enable Row-Level Security on the table
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);

    -- Step 2: Set Table-Level Grants for all relevant roles
    -- Admin has full power on all system tables
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO admin;', tbl);
    -- Viewer has read-only access on all system tables
    EXECUTE format('GRANT SELECT ON public.%I TO viewer;', tbl);
    -- Grant permissions to system-specific admins. RLS will handle row access.
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO cpan_admin;', tbl);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO maan_admin;', tbl);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO sdh_admin;', tbl);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO vmux_admin;', tbl);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO mng_admin;', tbl);
  END LOOP;
END;
$$;


-- =================================================================
-- PART 2: POLICIES FOR GENERIC TABLES (systems, system_connections)
-- These have complex logic checking the system_type of related records.
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

  -- Admin can do anything
  CREATE POLICY "Allow admin full access" ON public.systems FOR ALL TO admin USING (true) WITH CHECK (true);

  -- System-specific admins can access rows matching their designated system type
  CREATE POLICY "Allow full access based on system type" ON public.systems
  FOR ALL TO cpan_admin, maan_admin, sdh_admin, vmux_admin, mng_admin
  USING (
    (
      public.get_my_role() = 'cpan_admin' AND
      system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'CPAN')
    ) OR (
      public.get_my_role() = 'maan_admin' AND
      system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'MAAN')
    ) OR (
      public.get_my_role() = 'sdh_admin' AND
      system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'SDH')
    ) OR (
      public.get_my_role() = 'vmux_admin' AND
      system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'VMUX')
    ) OR (
      public.get_my_role() = 'mng_admin' AND
      system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'MNGPAN')
    )
  )
  WITH CHECK (
    -- The WITH CHECK clause re-uses the same logic for INSERTs and UPDATEs
    (
      public.get_my_role() = 'cpan_admin' AND
      system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'CPAN')
    ) OR (
      public.get_my_role() = 'maan_admin' AND
      system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'MAAN')
    ) OR (
      public.get_my_role() = 'sdh_admin' AND
      system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'SDH')
    ) OR (
      public.get_my_role() = 'vmux_admin' AND
      system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'VMUX')
    ) OR (
      public.get_my_role() = 'mng_admin' AND
      system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'MNGPAN')
    )
  );
END;
$$;


-- Policies for the 'system_connections' table
DO $$
BEGIN
  -- Clean up old policies for idempotency
  DROP POLICY IF EXISTS "Allow full access based on parent system type" ON public.system_connections;
  DROP POLICY IF EXISTS "Allow viewer read-access" ON public.system_connections;
  DROP POLICY IF EXISTS "Allow admin full access" ON public.system_connections;

  CREATE POLICY "Allow viewer read-access" ON public.system_connections FOR SELECT TO viewer USING (true);
  CREATE POLICY "Allow admin full access" ON public.system_connections FOR ALL TO admin USING (true) WITH CHECK (true);

  -- System-specific admins can access connections whose parent system matches their type.
  CREATE POLICY "Allow full access based on parent system type" ON public.system_connections
  FOR ALL TO cpan_admin, maan_admin, sdh_admin, vmux_admin, mng_admin
  USING (
    EXISTS (
      SELECT 1 FROM systems s WHERE s.id = system_connections.system_id AND (
        (
          public.get_my_role() = 'cpan_admin' AND
          s.system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'CPAN')
        ) OR (
          public.get_my_role() = 'maan_admin' AND
          s.system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'MAAN')
        ) OR (
          public.get_my_role() = 'sdh_admin' AND
          s.system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'SDH')
        ) OR (
          public.get_my_role() = 'vmux_admin' AND
          s.system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'VMUX')
        ) OR (
          public.get_my_role() = 'mng_admin' AND
          s.system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'MNGPAN')
        )
      )
    )
  )
  WITH CHECK ( -- Re-use the same logic for INSERTs and UPDATEs
    EXISTS (
      SELECT 1 FROM systems s WHERE s.id = system_connections.system_id AND (
        (
          public.get_my_role() = 'cpan_admin' AND
          s.system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'CPAN')
        ) OR (
          public.get_my_role() = 'maan_admin' AND
          s.system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'MAAN')
        ) OR (
          public.get_my_role() = 'sdh_admin' AND
          s.system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'SDH')
        ) OR (
          public.get_my_role() = 'vmux_admin' AND
          s.system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'VMUX')
        ) OR (
          public.get_my_role() = 'mng_admin' AND
          s.system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'MNGPAN')
        )
      )
    )
  );
END;
$$;


-- =================================================================
-- PART 3: AUTOMATED POLICIES FOR SYSTEM-SPECIFIC SUB-TABLES
-- These tables follow a simpler pattern: full access for admin and the designated system admin.
-- =================================================================
DO $$
DECLARE
    -- Use a 2D array to map tables to their specific admin roles
    -- Format: ARRAY['table_name', 'specific_admin_role']
    mappings TEXT[][] := ARRAY[
        ['ring_based_systems', 'cpan_admin'],
        ['ring_based_systems', 'maan_admin'], -- Both roles can manage this consolidated table
        ['sfp_based_connections', 'cpan_admin'],
        ['sfp_based_connections', 'maan_admin'], -- Both roles can manage this consolidated table
        ['sdh_systems', 'sdh_admin'],
        ['sdh_connections', 'sdh_admin'],
        ['sdh_node_associations', 'sdh_admin'],
        ['vmux_systems', 'vmux_admin'],
        ['vmux_connections', 'vmux_admin']
        -- Add new mappings here in the future
    ];
    tbl TEXT;
    specific_role TEXT;
    i INT;
BEGIN
    FOR i IN 1..array_length(mappings, 1)
    LOOP
        tbl := mappings[i][1];
        specific_role := mappings[i][2];

        -- Clean up old policies for idempotency
        EXECUTE format('DROP POLICY IF EXISTS "Allow viewer read-access" ON public.%I;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Allow admin full access" ON public.%I;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Allow %s full access" ON public.%I;', specific_role, tbl);

        -- Policy 1: Viewer can read everything
        EXECUTE format('CREATE POLICY "Allow viewer read-access" ON public.%I FOR SELECT TO viewer USING (true);', tbl);

        -- Policy 2: Admin can do everything
        EXECUTE format('CREATE POLICY "Allow admin full access" ON public.%I FOR ALL TO admin USING (true) WITH CHECK (true);', tbl);

        -- Policy 3: The specific system admin can do everything
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