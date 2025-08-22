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