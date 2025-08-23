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