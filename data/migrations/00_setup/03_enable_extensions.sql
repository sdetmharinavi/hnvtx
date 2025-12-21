-- path: migrations/00_setup/03_enable_extensions.sql
-- Description: Enables all required PostgreSQL extensions for the project.
-- This script should run early in the migration process.

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;

-- Add any other extensions you might need in the future here.
-- For example: CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; (Though Supabase enables this by default)