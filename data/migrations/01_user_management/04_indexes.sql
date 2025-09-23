-- Path: migrations/01_user_management/04_indexes.sql
-- Description: Indexes for user_profiles to improve performance.

-- Index for filtering users by their role
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles (role);

-- Index for filtering users by their status (e.g., active, inactive)
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON public.user_profiles (status);

-- Composite index for efficient searching and sorting by user's full name
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_name_first_name ON public.user_profiles (last_name, first_name);

-- Index on the creation timestamp to speed up date range filters
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON public.user_profiles (created_at);