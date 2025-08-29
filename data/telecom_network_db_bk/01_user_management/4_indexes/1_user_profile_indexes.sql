-- =================================================================
-- Indexes for User Management Module
-- =================================================================
-- This script creates indexes on the user_profiles table to improve
-- performance for filtering, searching, and sorting operations,
-- particularly for the admin user management interface.
-- =================================================================

-- Index for filtering users by their role
CREATE INDEX idx_user_profiles_role ON public.user_profiles (role);

-- Index for filtering users by their status (e.g., active, inactive)
CREATE INDEX idx_user_profiles_status ON public.user_profiles (status);

-- Composite index for efficient searching and sorting by user's full name
CREATE INDEX idx_user_profiles_last_name_first_name ON public.user_profiles (last_name, first_name);

-- Index on the creation timestamp to speed up date range filters
CREATE INDEX idx_user_profiles_created_at ON public.user_profiles (created_at);

-- Optional: Indexes for JSONB columns
-- Use GIN indexes on JSONB columns if you plan to frequently query
-- specific keys within the address or preferences data.
--
-- Example:
-- CREATE INDEX idx_user_profiles_address_gin ON public.user_profiles USING GIN (address);
-- CREATE INDEX idx_user_profiles_preferences_gin ON public.user_profiles USING GIN (preferences);