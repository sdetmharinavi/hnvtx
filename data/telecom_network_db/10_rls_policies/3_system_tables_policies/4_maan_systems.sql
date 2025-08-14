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