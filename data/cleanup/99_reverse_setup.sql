-- Path: supabase/cleanup/99_reverse_setup.sql
-- Description: Drops all custom database roles. This must be run last.

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Revoke role membership from 'authenticated' before dropping the roles.
    FOR r IN SELECT unnest(ARRAY['admin','cpan_admin','maan_admin','sdh_admin','vmux_admin','mng_admin','viewer']) as role_name
    LOOP
        EXECUTE format('REVOKE %I FROM authenticated', r.role_name);
    END LOOP;
END;
$$;

-- Drop the roles themselves
DROP ROLE IF EXISTS admin;
DROP ROLE IF EXISTS cpan_admin;
DROP ROLE IF EXISTS maan_admin;
DROP ROLE IF EXISTS sdh_admin;
DROP ROLE IF EXISTS vmux_admin;
DROP ROLE IF EXISTS mng_admin;
DROP ROLE IF EXISTS viewer;