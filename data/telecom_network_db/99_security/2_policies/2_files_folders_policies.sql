-- Core tables RLS policies (admin only)
DO $$
DECLARE 
  tbl text;
BEGIN 
  FOREACH tbl IN ARRAY ARRAY['folders', 'files'] 
  LOOP 
    -- Cleanup old policies
    EXECUTE format('DROP POLICY IF EXISTS "admin_select_%s" ON public.%I;', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "admin_insert_%s" ON public.%I;', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "admin_update_%s" ON public.%I;', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "admin_delete_%s" ON public.%I;', tbl, tbl);
    
    -- Enable RLS
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);

    -- Admin SELECT policy
    EXECUTE format($f$
      CREATE POLICY "admin_select_%s" ON public.%I 
      FOR SELECT TO admin 
      USING (true);
    $f$, tbl, tbl);

    -- Admin INSERT policy
    EXECUTE format($f$
      CREATE POLICY "admin_insert_%s" ON public.%I 
      FOR INSERT TO admin 
      WITH CHECK (true);
    $f$, tbl, tbl);

    -- Admin UPDATE policy
    EXECUTE format($f$
      CREATE POLICY "admin_update_%s" ON public.%I 
      FOR UPDATE TO admin 
      USING (true) 
      WITH CHECK (true);
    $f$, tbl, tbl);

    -- Admin DELETE policy
    EXECUTE format($f$
      CREATE POLICY "admin_delete_%s" ON public.%I 
      FOR DELETE TO admin 
      USING (true);
    $f$, tbl, tbl);
  END LOOP;
END;
$$;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.folders TO admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.files TO admin;