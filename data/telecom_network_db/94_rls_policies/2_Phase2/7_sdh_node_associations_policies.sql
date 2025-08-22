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
