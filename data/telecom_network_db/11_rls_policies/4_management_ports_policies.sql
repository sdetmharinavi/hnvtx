-- Management ports RLS policies
DO $$ 
BEGIN 
  -- Drop old policies
  DROP POLICY IF EXISTS policy_select_mng ON public.management_ports;
  DROP POLICY IF EXISTS policy_insert_mng ON public.management_ports;
  DROP POLICY IF EXISTS policy_update_mng ON public.management_ports;
  DROP POLICY IF EXISTS allow_admin_select ON public.management_ports;
  DROP POLICY IF EXISTS allow_admin_insert ON public.management_ports;
  DROP POLICY IF EXISTS allow_admin_update ON public.management_ports;
  DROP POLICY IF EXISTS viewer_read_access ON public.management_ports;
  DROP POLICY IF EXISTS mng_admin_access ON public.management_ports;

  -- SELECT policies
  CREATE POLICY viewer_read_access ON public.management_ports FOR SELECT TO viewer USING (true);
  CREATE POLICY allow_admin_select ON public.management_ports FOR SELECT TO admin USING (true);
  CREATE POLICY mng_admin_access ON public.management_ports FOR SELECT TO mng_admin USING (
    ((SELECT auth.jwt())->>'role') = 'mng_admin'
  );

  -- INSERT policies
  CREATE POLICY allow_admin_insert ON public.management_ports FOR INSERT TO admin WITH CHECK (true);
  CREATE POLICY mng_admin_insert ON public.management_ports FOR INSERT TO mng_admin WITH CHECK (
    ((SELECT auth.jwt())->>'role') = 'mng_admin'
  );

  -- UPDATE policies
  CREATE POLICY allow_admin_update ON public.management_ports FOR UPDATE TO admin USING (true) WITH CHECK (true);
  CREATE POLICY mng_admin_update ON public.management_ports FOR UPDATE TO mng_admin USING (
    ((SELECT auth.jwt())->>'role') = 'mng_admin'
  ) WITH CHECK (
    ((SELECT auth.jwt())->>'role') = 'mng_admin'
  );
END;
$$;