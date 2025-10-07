-- Path: migrations/00_setup/03_readonly_role.sql
-- Description: Creates a secure, read-only role for executing dynamic queries.

-- Create the role only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'readonly') THEN
        CREATE ROLE readonly;
    END IF;
END
$$;

-- Grant basic schema usage
GRANT USAGE ON SCHEMA public TO readonly;

-- Grant SELECT permissions on all current tables in the public schema
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly;

-- IMPORTANT: Ensure that any tables created in the future will also be selectable by this role.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly;

-- Allow the main authenticated role to switch to this readonly role
GRANT readonly TO authenticated;