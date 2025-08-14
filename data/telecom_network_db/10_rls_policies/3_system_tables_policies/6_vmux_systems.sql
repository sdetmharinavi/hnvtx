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