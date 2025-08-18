-- =============================================================================
-- MASTER DATABASE CLEANUP SCRIPT for telecom_network_db
-- =============================================================================
-- This script is designed to be run to completely reset the 'public' schema
-- by dropping all custom tables, views, functions, triggers, and policies.
-- It is safe to run even if the database is already clean.
--
-- It does NOT affect the 'auth' schema or other system schemas.
--
-- Execution Order:
-- 1. Drop All Views
-- 2. Drop All RLS Policies
-- 3. Drop All Triggers
-- 4. Drop All Functions
-- 5. Drop All Tables (CASCADE handles indexes, constraints, etc.)
-- =============================================================================
DO $$ BEGIN RAISE NOTICE 'Starting database cleanup...';
END $$;
-- -----------------------------------------------------------------------------
-- 1️⃣ Drop All Views in the 'public' schema
-- -----------------------------------------------------------------------------
DO $$
DECLARE r RECORD;
BEGIN RAISE NOTICE 'Dropping all views...';
FOR r IN (
    SELECT viewname
    FROM pg_views
    WHERE schemaname = 'public'
) LOOP EXECUTE 'DROP VIEW IF EXISTS public.' || quote_ident(r.viewname) || ' CASCADE;';
RAISE NOTICE 'Dropped view: %',
r.viewname;
END LOOP;
END $$;
-- -----------------------------------------------------------------------------
-- 2️⃣ Drop All RLS Policies on tables in the 'public' schema
-- -----------------------------------------------------------------------------
DO $$
DECLARE r RECORD;
BEGIN RAISE NOTICE 'Dropping all RLS policies...';
FOR r IN (
    SELECT tablename,
        policyname
    FROM pg_policies
    WHERE schemaname = 'public'
) LOOP EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.' || quote_ident(r.tablename) || ';';
RAISE NOTICE 'Dropped policy: % ON %',
r.policyname,
r.tablename;
END LOOP;
END $$;
-- -----------------------------------------------------------------------------
-- 3️⃣ Drop All Triggers on tables in the 'public' schema
-- -----------------------------------------------------------------------------
DO $$
DECLARE r RECORD;
BEGIN RAISE NOTICE 'Dropping all triggers...';
FOR r IN (
    SELECT tgname,
        relname
    FROM pg_trigger
        JOIN pg_class ON tgrelid = pg_class.oid
        JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
    WHERE nspname = 'public'
        AND NOT tgisinternal
) LOOP EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.tgname) || ' ON public.' || quote_ident(r.relname) || ' CASCADE;';
RAISE NOTICE 'Dropped trigger: % ON %',
r.tgname,
r.relname;
END LOOP;
END $$;
-- -----------------------------------------------------------------------------
-- 4️⃣ Drop All Functions in the 'public' schema
-- -----------------------------------------------------------------------------
DO $$
DECLARE r RECORD;
BEGIN RAISE NOTICE 'Dropping all functions...';
FOR r IN (
    SELECT p.oid::regprocedure::text as func_signature
    FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
) LOOP EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE;';
RAISE NOTICE 'Dropped function: %',
r.func_signature;
END LOOP;
END $$;
-- -----------------------------------------------------------------------------
-- 5️⃣ Drop All Tables in the 'public' schema
-- -----------------------------------------------------------------------------
DO $$
DECLARE r RECORD;
BEGIN RAISE NOTICE 'Dropping all tables...';
FOR r IN (
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
) LOOP EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE;';
RAISE NOTICE 'Dropped table: %',
r.tablename;
END LOOP;
END $$;
DO $$ BEGIN RAISE NOTICE 'Database cleanup finished successfully.';
END $$;