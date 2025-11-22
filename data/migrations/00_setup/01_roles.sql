-- Path: migrations/00_setup/01_roles.sql
-- Description: Creates all custom database roles. Must be run first.

-- Create roles only if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'admin') THEN
        CREATE ROLE admin NOINHERIT;
    END IF;

    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'cpan_admin') THEN
        CREATE ROLE cpan_admin NOINHERIT;
    END IF;

    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'maan_admin') THEN
        CREATE ROLE maan_admin NOINHERIT;
    END IF;

    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'sdh_admin') THEN
        CREATE ROLE sdh_admin NOINHERIT;
    END IF;

    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'asset_admin') THEN
        CREATE ROLE asset_admin NOINHERIT;
    END IF;

    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'mng_admin') THEN
        CREATE ROLE mng_admin NOINHERIT;
    END IF;

    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'viewer') THEN
        CREATE ROLE viewer NOINHERIT;
    END IF;
END
$$;

-- Safely grant membership to the 'authenticated' role for all custom roles.
-- This allows any logged-in user to assume one of these roles via JWT claims.
DO $$
DECLARE
    r TEXT;
BEGIN
    FOR r IN
        SELECT unnest(ARRAY['admin','cpan_admin','maan_admin','sdh_admin','asset_admin','mng_admin', 'viewer'])
    LOOP
        IF NOT EXISTS (
            SELECT 1
            FROM pg_auth_members m
            JOIN pg_roles r1 ON r1.oid = m.roleid
            JOIN pg_roles r2 ON r2.oid = m.member
            WHERE r1.rolname = r
              AND r2.rolname = 'authenticated'
        ) THEN
            EXECUTE format('GRANT %I TO authenticated', r);
        END IF;
    END LOOP;
END
$$;