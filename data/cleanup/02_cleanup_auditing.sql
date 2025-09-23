-- Path: supabase/cleanup/02_cleanup_auditing.sql
-- Description: Drops all objects related to the auditing module.

-- Note: The triggers attached by the audit system are dropped when their respective tables are dropped with CASCADE.
-- We only need to drop the core audit objects.

DROP TABLE IF EXISTS public.user_activity_logs CASCADE;
DROP FUNCTION IF EXISTS public.log_user_activity(TEXT, TEXT, TEXT, JSONB, JSONB, TEXT);
DROP FUNCTION IF EXISTS public.log_data_changes();