-- Generic systems table RLS policies
DO $$ 
BEGIN 
  -- Cleanup old policies
  DROP POLICY IF EXISTS policy_select_systems ON public.systems;
  DROP POLICY IF EXISTS policy_insert_systems ON public.systems;
  DROP POLICY IF EXISTS policy_update_systems ON public.systems;
  DROP POLICY IF EXISTS policy_delete_systems ON public.systems;
  DROP POLICY IF EXISTS viewer_read_access ON public.systems;
  DROP POLICY IF EXISTS allow_admin_select ON public.systems;
  DROP POLICY IF EXISTS allow_admin_insert ON public.systems;
  DROP POLICY IF EXISTS allow_admin_update ON public.systems;
  DROP POLICY IF EXISTS allow_admin_delete ON public.systems;
  DROP POLICY IF EXISTS maan_admin_access ON public.systems;
  DROP POLICY IF EXISTS sdh_admin_access ON public.systems;
  DROP POLICY IF EXISTS vmux_admin_access ON public.systems;
  DROP POLICY IF EXISTS mng_admin_access ON public.systems;

  -- SELECT POLICIES
  CREATE POLICY viewer_read_access ON public.systems FOR SELECT TO viewer USING (true);
  CREATE POLICY allow_admin_select ON public.systems FOR SELECT TO admin USING (true);
  
  CREATE POLICY maan_admin_access ON public.systems FOR SELECT TO maan_admin USING (
    ((SELECT auth.jwt())->>'role') = 'maan_admin' AND
    system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'MAAN')
  );
  
  CREATE POLICY sdh_admin_access ON public.systems FOR SELECT TO sdh_admin USING (
    ((SELECT auth.jwt())->>'role') = 'sdh_admin' AND
    system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'SDH')
  );
  
  CREATE POLICY vmux_admin_access ON public.systems FOR SELECT TO vmux_admin USING (
    ((SELECT auth.jwt())->>'role') = 'vmux_admin' AND
    system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'VMUX')
  );
  
  CREATE POLICY mng_admin_access ON public.systems FOR SELECT TO mng_admin USING (
    ((SELECT auth.jwt())->>'role') = 'mng_admin' AND
    system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'MNGPAN')
  );

  -- INSERT POLICIES
  CREATE POLICY allow_admin_insert ON public.systems FOR INSERT TO admin WITH CHECK (true);
  
  CREATE POLICY maan_admin_insert ON public.systems FOR INSERT TO maan_admin WITH CHECK (
    ((SELECT auth.jwt())->>'role') = 'maan_admin' AND
    system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'MAAN')
  );
  
  CREATE POLICY sdh_admin_insert ON public.systems FOR INSERT TO sdh_admin WITH CHECK (
    ((SELECT auth.jwt())->>'role') = 'sdh_admin' AND
    system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'SDH')
  );
  
  CREATE POLICY vmux_admin_insert ON public.systems FOR INSERT TO vmux_admin WITH CHECK (
    ((SELECT auth.jwt())->>'role') = 'vmux_admin' AND
    system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'VMUX')
  );
  
  CREATE POLICY mng_admin_insert ON public.systems FOR INSERT TO mng_admin WITH CHECK (
    ((SELECT auth.jwt())->>'role') = 'mng_admin' AND
    system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'MNGPAN')
  );

  -- UPDATE POLICIES
  CREATE POLICY allow_admin_update ON public.systems FOR UPDATE TO admin USING (true) WITH CHECK (true);
  
  CREATE POLICY maan_admin_update ON public.systems FOR UPDATE TO maan_admin USING (
    ((SELECT auth.jwt())->>'role') = 'maan_admin' AND
    system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'MAAN')
  ) WITH CHECK (
    ((SELECT auth.jwt())->>'role') = 'maan_admin' AND
    system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'MAAN')
  );
  
  CREATE POLICY sdh_admin_update ON public.systems FOR UPDATE TO sdh_admin USING (
    ((SELECT auth.jwt())->>'role') = 'sdh_admin' AND
    system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'SDH')
  ) WITH CHECK (
    ((SELECT auth.jwt())->>'role') = 'sdh_admin' AND
    system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'SDH')
  );
  
  CREATE POLICY vmux_admin_update ON public.systems FOR UPDATE TO vmux_admin USING (
    ((SELECT auth.jwt())->>'role') = 'vmux_admin' AND
    system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'VMUX')
  ) WITH CHECK (
    ((SELECT auth.jwt())->>'role') = 'vmux_admin' AND
    system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'VMUX')
  );
  
  CREATE POLICY mng_admin_update ON public.systems FOR UPDATE TO mng_admin USING (
    ((SELECT auth.jwt())->>'role') = 'mng_admin' AND
    system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'MNGPAN')
  ) WITH CHECK (
    ((SELECT auth.jwt())->>'role') = 'mng_admin' AND
    system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'MNGPAN')
  );

  -- DELETE POLICY (admin only)
  CREATE POLICY allow_admin_delete ON public.systems FOR DELETE TO admin USING (true);
END;
$$;

-- Generic system_connections table RLS policies
DO $$ 
BEGIN 
  -- Cleanup old policies
  DROP POLICY IF EXISTS policy_select_system_connections ON public.system_connections;
  DROP POLICY IF EXISTS policy_insert_system_connections ON public.system_connections;
  DROP POLICY IF EXISTS policy_update_system_connections ON public.system_connections;
  DROP POLICY IF EXISTS policy_delete_system_connections ON public.system_connections;
  DROP POLICY IF EXISTS viewer_read_access ON public.system_connections;
  DROP POLICY IF EXISTS allow_admin_select ON public.system_connections;
  DROP POLICY IF EXISTS allow_admin_insert ON public.system_connections;
  DROP POLICY IF EXISTS allow_admin_update ON public.system_connections;
  DROP POLICY IF EXISTS allow_admin_delete ON public.system_connections;
  DROP POLICY IF EXISTS maan_admin_access ON public.system_connections;
  DROP POLICY IF EXISTS sdh_admin_access ON public.system_connections;
  DROP POLICY IF EXISTS vmux_admin_access ON public.system_connections;
  DROP POLICY IF EXISTS mng_admin_access ON public.system_connections;

  -- SELECT POLICIES
  CREATE POLICY viewer_read_access ON public.system_connections FOR SELECT TO viewer USING (true);
  CREATE POLICY allow_admin_select ON public.system_connections FOR SELECT TO admin USING (true);
  
  CREATE POLICY maan_admin_access ON public.system_connections FOR SELECT TO maan_admin USING (
    ((SELECT auth.jwt())->>'role') = 'maan_admin' AND
    EXISTS (
      SELECT 1 FROM systems s 
      WHERE s.id = system_connections.system_id AND
      s.system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'MAAN')
    )
  );
  
  CREATE POLICY sdh_admin_access ON public.system_connections FOR SELECT TO sdh_admin USING (
    ((SELECT auth.jwt())->>'role') = 'sdh_admin' AND
    EXISTS (
      SELECT 1 FROM systems s 
      WHERE s.id = system_connections.system_id AND
      s.system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'SDH')
    )
  );
  
  CREATE POLICY vmux_admin_access ON public.system_connections FOR SELECT TO vmux_admin USING (
    ((SELECT auth.jwt())->>'role') = 'vmux_admin' AND
    EXISTS (
      SELECT 1 FROM systems s 
      WHERE s.id = system_connections.system_id AND
      s.system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'VMUX')
    )
  );
  
  CREATE POLICY mng_admin_access ON public.system_connections FOR SELECT TO mng_admin USING (
    ((SELECT auth.jwt())->>'role') = 'mng_admin' AND
    EXISTS (
      SELECT 1 FROM systems s 
      WHERE s.id = system_connections.system_id AND
      s.system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'MNGPAN')
    )
  );

  -- INSERT POLICIES
  CREATE POLICY allow_admin_insert ON public.system_connections FOR INSERT TO admin WITH CHECK (true);
  
  CREATE POLICY maan_admin_insert ON public.system_connections FOR INSERT TO maan_admin WITH CHECK (
    ((SELECT auth.jwt())->>'role') = 'maan_admin' AND
    EXISTS (
      SELECT 1 FROM systems s 
      WHERE s.id = system_connections.system_id AND
      s.system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'MAAN')
    )
  );
  
  CREATE POLICY sdh_admin_insert ON public.system_connections FOR INSERT TO sdh_admin WITH CHECK (
    ((SELECT auth.jwt())->>'role') = 'sdh_admin' AND
    EXISTS (
      SELECT 1 FROM systems s 
      WHERE s.id = system_connections.system_id AND
      s.system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'SDH')
    )
  );
  
  CREATE POLICY vmux_admin_insert ON public.system_connections FOR INSERT TO vmux_admin WITH CHECK (
    ((SELECT auth.jwt())->>'role') = 'vmux_admin' AND
    EXISTS (
      SELECT 1 FROM systems s 
      WHERE s.id = system_connections.system_id AND
      s.system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'VMUX')
    )
  );
  
  CREATE POLICY mng_admin_insert ON public.system_connections FOR INSERT TO mng_admin WITH CHECK (
    ((SELECT auth.jwt())->>'role') = 'mng_admin' AND
    EXISTS (
      SELECT 1 FROM systems s 
      WHERE s.id = system_connections.system_id AND
      s.system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'MNGPAN')
    )
  );

  -- UPDATE POLICIES
  CREATE POLICY allow_admin_update ON public.system_connections FOR UPDATE TO admin USING (true) WITH CHECK (true);
  
  CREATE POLICY maan_admin_update ON public.system_connections FOR UPDATE TO maan_admin USING (
    ((SELECT auth.jwt())->>'role') = 'maan_admin' AND
    EXISTS (
      SELECT 1 FROM systems s 
      WHERE s.id = system_connections.system_id AND
      s.system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'MAAN')
    )
  ) WITH CHECK (
    ((SELECT auth.jwt())->>'role') = 'maan_admin' AND
    EXISTS (
      SELECT 1 FROM systems s 
      WHERE s.id = system_connections.system_id AND
      s.system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'MAAN')
    )
  );
  
  CREATE POLICY sdh_admin_update ON public.system_connections FOR UPDATE TO sdh_admin USING (
    ((SELECT auth.jwt())->>'role') = 'sdh_admin' AND
    EXISTS (
      SELECT 1 FROM systems s 
      WHERE s.id = system_connections.system_id AND
      s.system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'SDH')
    )
  ) WITH CHECK (
    ((SELECT auth.jwt())->>'role') = 'sdh_admin' AND
    EXISTS (
      SELECT 1 FROM systems s 
      WHERE s.id = system_connections.system_id AND
      s.system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'SDH')
    )
  );
  
  CREATE POLICY vmux_admin_update ON public.system_connections FOR UPDATE TO vmux_admin USING (
    ((SELECT auth.jwt())->>'role') = 'vmux_admin' AND
    EXISTS (
      SELECT 1 FROM systems s 
      WHERE s.id = system_connections.system_id AND
      s.system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'VMUX')
    )
  ) WITH CHECK (
    ((SELECT auth.jwt())->>'role') = 'vmux_admin' AND
    EXISTS (
      SELECT 1 FROM systems s 
      WHERE s.id = system_connections.system_id AND
      s.system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'VMUX')
    )
  );
  
  CREATE POLICY mng_admin_update ON public.system_connections FOR UPDATE TO mng_admin USING (
    ((SELECT auth.jwt())->>'role') = 'mng_admin' AND
    EXISTS (
      SELECT 1 FROM systems s 
      WHERE s.id = system_connections.system_id AND
      s.system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'MNGPAN')
    )
  ) WITH CHECK (
    ((SELECT auth.jwt())->>'role') = 'mng_admin' AND
    EXISTS (
      SELECT 1 FROM systems s 
      WHERE s.id = system_connections.system_id AND
      s.system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'MNGPAN')
    )
  );

  -- DELETE POLICY (admin only)
  CREATE POLICY allow_admin_delete ON public.system_connections FOR DELETE TO admin USING (true);
END;
$$;

-- CPAN systems RLS policies
DO $$ 
BEGIN 
  -- Cleanup old policies
  DROP POLICY IF EXISTS policy_select_cpan ON public.cpan_systems;
  DROP POLICY IF EXISTS policy_insert_cpan ON public.cpan_systems;
  DROP POLICY IF EXISTS policy_update_cpan ON public.cpan_systems;
  DROP POLICY IF EXISTS allow_admin_select ON public.cpan_systems;
  DROP POLICY IF EXISTS allow_admin_insert ON public.cpan_systems;
  DROP POLICY IF EXISTS allow_admin_update ON public.cpan_systems;
  DROP POLICY IF EXISTS viewer_read_access ON public.cpan_systems;
  DROP POLICY IF EXISTS cpan_admin_access ON public.cpan_systems;

  -- SELECT policies
  CREATE POLICY viewer_read_access ON public.cpan_systems FOR SELECT TO viewer USING (true);
  CREATE POLICY allow_admin_select ON public.cpan_systems FOR SELECT TO admin USING (true);
  CREATE POLICY cpan_admin_access ON public.cpan_systems FOR SELECT TO cpan_admin USING (
    ((SELECT auth.jwt())->>'role') = 'cpan_admin'
  );

  -- INSERT policies
  CREATE POLICY allow_admin_insert ON public.cpan_systems FOR INSERT TO admin WITH CHECK (true);
  CREATE POLICY cpan_admin_insert ON public.cpan_systems FOR INSERT TO cpan_admin WITH CHECK (
    ((SELECT auth.jwt())->>'role') = 'cpan_admin'
  );

  -- UPDATE policies
  CREATE POLICY allow_admin_update ON public.cpan_systems FOR UPDATE TO admin USING (true) WITH CHECK (true);
  CREATE POLICY cpan_admin_update ON public.cpan_systems FOR UPDATE TO cpan_admin USING (
    ((SELECT auth.jwt())->>'role') = 'cpan_admin'
  ) WITH CHECK (
    ((SELECT auth.jwt())->>'role') = 'cpan_admin'
  );
END;
$$;

-- MAAN systems RLS policies
DO $$ 
BEGIN 
  -- Cleanup old policies
  DROP POLICY IF EXISTS policy_select_maan ON public.maan_systems;
  DROP POLICY IF EXISTS policy_insert_maan ON public.maan_systems;
  DROP POLICY IF EXISTS policy_update_maan ON public.maan_systems;
  DROP POLICY IF EXISTS allow_admin_select ON public.maan_systems;
  DROP POLICY IF EXISTS allow_admin_insert ON public.maan_systems;
  DROP POLICY IF EXISTS allow_admin_update ON public.maan_systems;
  DROP POLICY IF EXISTS viewer_read_access ON public.maan_systems;
  DROP POLICY IF EXISTS maan_admin_access ON public.maan_systems;

  -- SELECT policies
  CREATE POLICY viewer_read_access ON public.maan_systems FOR SELECT TO viewer USING (true);
  CREATE POLICY allow_admin_select ON public.maan_systems FOR SELECT TO admin USING (true);
  CREATE POLICY maan_admin_access ON public.maan_systems FOR SELECT TO maan_admin USING (
    ((SELECT auth.jwt())->>'role') = 'maan_admin'
  );

  -- INSERT policies
  CREATE POLICY allow_admin_insert ON public.maan_systems FOR INSERT TO admin WITH CHECK (true);
  CREATE POLICY maan_admin_insert ON public.maan_systems FOR INSERT TO maan_admin WITH CHECK (
    ((SELECT auth.jwt())->>'role') = 'maan_admin'
  );

  -- UPDATE policies
  CREATE POLICY allow_admin_update ON public.maan_systems FOR UPDATE TO admin USING (true) WITH CHECK (true);
  CREATE POLICY maan_admin_update ON public.maan_systems FOR UPDATE TO maan_admin USING (
    ((SELECT auth.jwt())->>'role') = 'maan_admin'
  ) WITH CHECK (
    ((SELECT auth.jwt())->>'role') = 'maan_admin'
  );
END;
$$;

-- SDH systems RLS policies
DO $$ 
BEGIN 
  -- Cleanup old policies
  DROP POLICY IF EXISTS policy_select_sdh ON public.sdh_systems;
  DROP POLICY IF EXISTS policy_insert_sdh ON public.sdh_systems;
  DROP POLICY IF EXISTS policy_update_sdh ON public.sdh_systems;
  DROP POLICY IF EXISTS allow_admin_select ON public.sdh_systems;
  DROP POLICY IF EXISTS allow_admin_insert ON public.sdh_systems;
  DROP POLICY IF EXISTS allow_admin_update ON public.sdh_systems;
  DROP POLICY IF EXISTS viewer_read_access ON public.sdh_systems;
  DROP POLICY IF EXISTS sdh_admin_access ON public.sdh_systems;

  -- SELECT policies
  CREATE POLICY viewer_read_access ON public.sdh_systems FOR SELECT TO viewer USING (true);
  CREATE POLICY allow_admin_select ON public.sdh_systems FOR SELECT TO admin USING (true);
  CREATE POLICY sdh_admin_access ON public.sdh_systems FOR SELECT TO sdh_admin USING (
    ((SELECT auth.jwt())->>'role') = 'sdh_admin'
  );

  -- INSERT policies
  CREATE POLICY allow_admin_insert ON public.sdh_systems FOR INSERT TO admin WITH CHECK (true);
  CREATE POLICY sdh_admin_insert ON public.sdh_systems FOR INSERT TO sdh_admin WITH CHECK (
    ((SELECT auth.jwt())->>'role') = 'sdh_admin'
  );

  -- UPDATE policies
  CREATE POLICY allow_admin_update ON public.sdh_systems FOR UPDATE TO admin USING (true) WITH CHECK (true);
  CREATE POLICY sdh_admin_update ON public.sdh_systems FOR UPDATE TO sdh_admin USING (
    ((SELECT auth.jwt())->>'role') = 'sdh_admin'
  ) WITH CHECK (
    ((SELECT auth.jwt())->>'role') = 'sdh_admin'
  );
END;
$$;

-- VMUX systems RLS policies
DO $$ 
BEGIN 
  -- Drop old policies
  DROP POLICY IF EXISTS policy_select_vmux ON public.vmux_systems;
  DROP POLICY IF EXISTS policy_insert_vmux ON public.vmux_systems;
  DROP POLICY IF EXISTS policy_update_vmux ON public.vmux_systems;
  DROP POLICY IF EXISTS allow_admin_select ON public.vmux_systems;
  DROP POLICY IF EXISTS allow_admin_insert ON public.vmux_systems;
  DROP POLICY IF EXISTS allow_admin_update ON public.vmux_systems;
  DROP POLICY IF EXISTS viewer_read_access ON public.vmux_systems;
  DROP POLICY IF EXISTS vmux_admin_access ON public.vmux_systems;

  -- SELECT policies
  CREATE POLICY viewer_read_access ON public.vmux_systems FOR SELECT TO viewer USING (true);
  CREATE POLICY allow_admin_select ON public.vmux_systems FOR SELECT TO admin USING (true);
  CREATE POLICY vmux_admin_access ON public.vmux_systems FOR SELECT TO vmux_admin USING (
    ((SELECT auth.jwt())->>'role') = 'vmux_admin'
  );

  -- INSERT policies
  CREATE POLICY allow_admin_insert ON public.vmux_systems FOR INSERT TO admin WITH CHECK (true);
  CREATE POLICY vmux_admin_insert ON public.vmux_systems FOR INSERT TO vmux_admin WITH CHECK (
    ((SELECT auth.jwt())->>'role') = 'vmux_admin'
  );

  -- UPDATE policies
  CREATE POLICY allow_admin_update ON public.vmux_systems FOR UPDATE TO admin USING (true) WITH CHECK (true);
  CREATE POLICY vmux_admin_update ON public.vmux_systems FOR UPDATE TO vmux_admin USING (
    ((SELECT auth.jwt())->>'role') = 'vmux_admin'
  ) WITH CHECK (
    ((SELECT auth.jwt())->>'role') = 'vmux_admin'
  );
END;
$$;

-- CPAN connections RLS policies
DO $$
DECLARE 
  tbl text;
  role text;
BEGIN 
  -- Tables with extended access
  FOREACH tbl IN ARRAY ARRAY ['cpan_connections'] 
  LOOP 
    -- Drop viewer_read_access first (common)
    EXECUTE format('DROP POLICY IF EXISTS viewer_read_access ON public.%s;', tbl);
    EXECUTE format($f$
      CREATE POLICY viewer_read_access ON public.%I 
      FOR SELECT TO viewer 
      USING (((SELECT auth.jwt())->>'role') = 'viewer');
    $f$, tbl);
  END LOOP;

  -- CPAN connections: admin + cpan_admin
  FOREACH tbl IN ARRAY ARRAY ['cpan_connections'] 
  LOOP 
    FOREACH role IN ARRAY ARRAY ['admin', 'cpan_admin'] 
    LOOP 
      -- SELECT
      EXECUTE format('DROP POLICY IF EXISTS allow_%s_select ON public.%s;', role, tbl);
      EXECUTE format($f$
        CREATE POLICY allow_%s_select ON public.%I 
        FOR SELECT TO %I 
        USING (((SELECT auth.jwt())->>'role') = '%s');
      $f$, role, tbl, role, role);

      -- INSERT
      EXECUTE format('DROP POLICY IF EXISTS allow_%s_insert ON public.%s;', role, tbl);
      EXECUTE format($f$
        CREATE POLICY allow_%s_insert ON public.%I 
        FOR INSERT TO %I 
        WITH CHECK (((SELECT auth.jwt())->>'role') = '%s');
      $f$, role, tbl, role, role);

      -- UPDATE
      EXECUTE format('DROP POLICY IF EXISTS allow_%s_update ON public.%s;', role, tbl);
      EXECUTE format($f$
        CREATE POLICY allow_%s_update ON public.%I 
        FOR UPDATE TO %I 
        USING (((SELECT auth.jwt())->>'role') = '%s')
        WITH CHECK (((SELECT auth.jwt())->>'role') = '%s');
      $f$, role, tbl, role, role, role);

      -- DELETE
      EXECUTE format('DROP POLICY IF EXISTS allow_%s_delete ON public.%s;', role, tbl);
      EXECUTE format($f$
        CREATE POLICY allow_%s_delete ON public.%I 
        FOR DELETE TO %I 
        USING (((SELECT auth.jwt())->>'role') = '%s');
      $f$, role, tbl, role, role);
    END LOOP;
  END LOOP;
END;
$$;

-- MAAN connections RLS policies
DO $$
DECLARE 
  tbl text;
  role text;
BEGIN 
  -- Tables with extended access
  FOREACH tbl IN ARRAY ARRAY ['maan_connections'] 
  LOOP 
    -- Drop viewer_read_access first (common)
    EXECUTE format('DROP POLICY IF EXISTS viewer_read_access ON public.%s;', tbl);
    EXECUTE format($f$
      CREATE POLICY viewer_read_access ON public.%I 
      FOR SELECT TO viewer 
      USING (((SELECT auth.jwt())->>'role') = 'viewer');
    $f$, tbl);
  END LOOP;

  -- Maan connections: admin + maan_admin
  FOREACH tbl IN ARRAY ARRAY ['maan_connections'] 
  LOOP 
    FOREACH role IN ARRAY ARRAY ['admin', 'maan_admin'] 
    LOOP 
      -- SELECT
      EXECUTE format('DROP POLICY IF EXISTS allow_%s_select ON public.%s;', role, tbl);
      EXECUTE format($f$
        CREATE POLICY allow_%s_select ON public.%I 
        FOR SELECT TO %I 
        USING (((SELECT auth.jwt())->>'role') = '%s');
      $f$, role, tbl, role, role);

      -- INSERT
      EXECUTE format('DROP POLICY IF EXISTS allow_%s_insert ON public.%s;', role, tbl);
      EXECUTE format($f$
        CREATE POLICY allow_%s_insert ON public.%I 
        FOR INSERT TO %I 
        WITH CHECK (((SELECT auth.jwt())->>'role') = '%s');
      $f$, role, tbl, role, role);

      -- UPDATE
      EXECUTE format('DROP POLICY IF EXISTS allow_%s_update ON public.%s;', role, tbl);
      EXECUTE format($f$
        CREATE POLICY allow_%s_update ON public.%I 
        FOR UPDATE TO %I 
        USING (((SELECT auth.jwt())->>'role') = '%s')
        WITH CHECK (((SELECT auth.jwt())->>'role') = '%s');
      $f$, role, tbl, role, role, role);

      -- DELETE
      EXECUTE format('DROP POLICY IF EXISTS allow_%s_delete ON public.%s;', role, tbl);
      EXECUTE format($f$
        CREATE POLICY allow_%s_delete ON public.%I 
        FOR DELETE TO %I 
        USING (((SELECT auth.jwt())->>'role') = '%s');
      $f$, role, tbl, role, role);
    END LOOP;
  END LOOP;
END;
$$;

-- SDH connections RLS policies
DO $$
DECLARE 
  tbl text;
  role text;
BEGIN 
  -- Tables with extended access
  FOREACH tbl IN ARRAY ARRAY ['sdh_connections'] 
  LOOP 
    -- Drop viewer_read_access first (common)
    EXECUTE format('DROP POLICY IF EXISTS viewer_read_access ON public.%s;', tbl);
    EXECUTE format($f$
      CREATE POLICY viewer_read_access ON public.%I 
      FOR SELECT TO viewer 
      USING (((SELECT auth.jwt())->>'role') = 'viewer');
    $f$, tbl);
  END LOOP;

  -- SDH connections: admin + sdh_admin
  FOREACH tbl IN ARRAY ARRAY ['sdh_connections'] 
  LOOP 
    FOREACH role IN ARRAY ARRAY ['admin', 'sdh_admin'] 
    LOOP 
      -- SELECT
      EXECUTE format('DROP POLICY IF EXISTS allow_%s_select ON public.%s;', role, tbl);
      EXECUTE format($f$
        CREATE POLICY allow_%s_select ON public.%I 
        FOR SELECT TO %I 
        USING (((SELECT auth.jwt())->>'role') = '%s');
      $f$, role, tbl, role, role);

      -- INSERT
      EXECUTE format('DROP POLICY IF EXISTS allow_%s_insert ON public.%s;', role, tbl);
      EXECUTE format($f$
        CREATE POLICY allow_%s_insert ON public.%I 
        FOR INSERT TO %I 
        WITH CHECK (((SELECT auth.jwt())->>'role') = '%s');
      $f$, role, tbl, role, role);

      -- UPDATE
      EXECUTE format('DROP POLICY IF EXISTS allow_%s_update ON public.%s;', role, tbl);
      EXECUTE format($f$
        CREATE POLICY allow_%s_update ON public.%I 
        FOR UPDATE TO %I 
        USING (((SELECT auth.jwt())->>'role') = '%s')
        WITH CHECK (((SELECT auth.jwt())->>'role') = '%s');
      $f$, role, tbl, role, role, role);

      -- DELETE
      EXECUTE format('DROP POLICY IF EXISTS allow_%s_delete ON public.%s;', role, tbl);
      EXECUTE format($f$
        CREATE POLICY allow_%s_delete ON public.%I 
        FOR DELETE TO %I 
        USING (((SELECT auth.jwt())->>'role') = '%s');
      $f$, role, tbl, role, role);
    END LOOP;
  END LOOP;
END;
$$;

-- VMUX connections RLS policies
DO $$
DECLARE 
  tbl text;
  role text;
BEGIN 
  -- Tables with extended access
  FOREACH tbl IN ARRAY ARRAY ['vmux_connections'] 
  LOOP 
    -- Drop viewer_read_access first (common)
    EXECUTE format('DROP POLICY IF EXISTS viewer_read_access ON public.%s;', tbl);
    EXECUTE format($f$
      CREATE POLICY viewer_read_access ON public.%I 
      FOR SELECT TO viewer 
      USING (((SELECT auth.jwt())->>'role') = 'viewer');
    $f$, tbl);
  END LOOP;

  -- VMUX connections: admin + vmux_admin
  FOREACH tbl IN ARRAY ARRAY ['vmux_connections'] 
  LOOP 
    FOREACH role IN ARRAY ARRAY ['admin', 'vmux_admin'] 
    LOOP 
      -- SELECT
      EXECUTE format('DROP POLICY IF EXISTS allow_%s_select ON public.%s;', role, tbl);
      EXECUTE format($f$
        CREATE POLICY allow_%s_select ON public.%I 
        FOR SELECT TO %I 
        USING (((SELECT auth.jwt())->>'role') = '%s');
      $f$, role, tbl, role, role);

      -- INSERT
      EXECUTE format('DROP POLICY IF EXISTS allow_%s_insert ON public.%s;', role, tbl);
      EXECUTE format($f$
        CREATE POLICY allow_%s_insert ON public.%I 
        FOR INSERT TO %I 
        WITH CHECK (((SELECT auth.jwt())->>'role') = '%s');
      $f$, role, tbl, role, role);

      -- UPDATE
      EXECUTE format('DROP POLICY IF EXISTS allow_%s_update ON public.%s;', role, tbl);
      EXECUTE format($f$
        CREATE POLICY allow_%s_update ON public.%I 
        FOR UPDATE TO %I 
        USING (((SELECT auth.jwt())->>'role') = '%s')
        WITH CHECK (((SELECT auth.jwt())->>'role') = '%s');
      $f$, role, tbl, role, role, role);

      -- DELETE
      EXECUTE format('DROP POLICY IF EXISTS allow_%s_delete ON public.%s;', role, tbl);
      EXECUTE format($f$
        CREATE POLICY allow_%s_delete ON public.%I 
        FOR DELETE TO %I 
        USING (((SELECT auth.jwt())->>'role') = '%s');
      $f$, role, tbl, role, role);
    END LOOP;
  END LOOP;
END;
$$;

-- SDH node associations RLS policies
DO $$
DECLARE 
  tbl text;
  role text;
BEGIN
  -- Tables with extended access
  FOREACH tbl IN ARRAY ARRAY['sdh_node_associations'] LOOP
    -- Drop viewer_read_access first (common)
    EXECUTE format(
      'DROP POLICY IF EXISTS viewer_read_access ON public.%I;',
      tbl
    );
    EXECUTE format(
      $f$ CREATE POLICY viewer_read_access ON public.%I
           FOR SELECT TO viewer
           USING ((SELECT auth.jwt())->>'role' = 'viewer'); $f$,
      tbl
    );
  END LOOP;

  -- SDH Node Associations: only admin
  FOREACH tbl IN ARRAY ARRAY['sdh_node_associations'] LOOP
    FOREACH role IN ARRAY ARRAY['admin'] LOOP
      
      -- SELECT
      EXECUTE format(
        'DROP POLICY IF EXISTS allow_%s_select ON public.%I;',
        role, tbl
      );
      EXECUTE format(
        $f$ CREATE POLICY allow_%s_select ON public.%I
             FOR SELECT TO %I
             USING ((SELECT auth.jwt())->>'role' = %L); $f$,
        role, tbl, role, role
      );

      -- INSERT
      EXECUTE format(
        'DROP POLICY IF EXISTS allow_%s_insert ON public.%I;',
        role, tbl
      );
      EXECUTE format(
        $f$ CREATE POLICY allow_%s_insert ON public.%I
             FOR INSERT TO %I
             WITH CHECK ((SELECT auth.jwt())->>'role' = %L); $f$,
        role, tbl, role, role
      );

      -- UPDATE
      EXECUTE format(
        'DROP POLICY IF EXISTS allow_%s_update ON public.%I;',
        role, tbl
      );
      EXECUTE format(
        $f$ CREATE POLICY allow_%s_update ON public.%I
             FOR UPDATE TO %I
             USING ((SELECT auth.jwt())->>'role' = %L)
             WITH CHECK ((SELECT auth.jwt())->>'role' = %L); $f$,
        role, tbl, role, role, role
      );

      -- DELETE
      EXECUTE format(
        'DROP POLICY IF EXISTS allow_%s_delete ON public.%I;',
        role, tbl
      );
      EXECUTE format(
        $f$ CREATE POLICY allow_%s_delete ON public.%I
             FOR DELETE TO %I
             USING ((SELECT auth.jwt())->>'role' = %L); $f$,
        role, tbl, role, role
      );

    END LOOP;
  END LOOP;
END;
$$;
