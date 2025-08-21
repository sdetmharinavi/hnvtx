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