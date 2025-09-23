-- Path: migrations/05_auditing/03_triggers_attach_all.sql
-- Description: Dynamically attaches the log_data_changes trigger to all relevant tables.
-- This script is idempotent and can be re-run safely.

DO $$
DECLARE
    table_rec RECORD;
    trigger_name TEXT;
BEGIN
    -- Loop through all user tables in the 'public' schema
    FOR table_rec IN
        SELECT t.table_name
        FROM information_schema.tables t
        WHERE t.table_schema = 'public'
          AND t.table_type = 'BASE TABLE'
          -- Exclude the log table itself to prevent infinite loops
          AND t.table_name <> 'user_activity_logs'
          -- Only attach to tables that have an 'id' column, which is our standard for auditable records
          AND EXISTS (
              SELECT 1
              FROM information_schema.columns c
              WHERE c.table_schema = t.table_schema
                AND c.table_name = t.table_name
                AND c.column_name = 'id'
          )
    LOOP
        trigger_name := table_rec.table_name || '_log_trigger';

        -- Drop the trigger if it already exists to ensure it's up-to-date
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I;', trigger_name, table_rec.table_name);

        -- Create the new trigger
        EXECUTE format('CREATE TRIGGER %I ' ||
                       'AFTER INSERT OR UPDATE OR DELETE ON public.%I ' ||
                       'FOR EACH ROW EXECUTE FUNCTION public.log_data_changes();',
                       trigger_name,
                       table_rec.table_name);

        RAISE NOTICE 'Created/Refreshed audit trigger on table: public.%', table_rec.table_name;
    END LOOP;
END;
$$;