DO $$
DECLARE 
  r RECORD;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure::text AS func_signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS %s CASCADE;', r.func_signature);
  END LOOP;
END $$;
