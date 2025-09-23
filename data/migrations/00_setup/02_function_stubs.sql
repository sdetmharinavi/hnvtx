-- Path: migrations/00_setup/02_function_stubs.sql
-- Description: Creates dummy "stub" versions of functions that may be optionally defined later.
-- This prevents dependency errors if certain modules (like Auditing) are not deployed.

-- Stub for the user activity logging function.
-- The real version is in the 05_auditing module.
CREATE OR REPLACE FUNCTION public.log_user_activity(
    p_action_type TEXT,
    p_table_name TEXT DEFAULT NULL,
    p_record_id TEXT DEFAULT NULL,
    p_old_data JSONB DEFAULT NULL,
    p_new_data JSONB DEFAULT NULL,
    p_details TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    -- This is a stub function. It does nothing.
    -- If the 05_auditing module is deployed, it will replace this function
    -- with the real implementation.
    RETURN;
END;
$$;