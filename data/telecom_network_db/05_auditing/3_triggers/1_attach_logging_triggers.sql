-- REFACTORED: This script now automatically attaches the log_data_changes trigger
-- to all tables in the public schema that have an 'id' column and are not logs themselves.

DO $$
DECLARE
    table_rec RECORD;
BEGIN
    -- Loop through all user tables in the 'public' schema
    FOR table_rec IN
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          -- Ensure it's a real table, not a view
          AND table_type = 'BASE TABLE'
          -- Exclude the log table itself to prevent infinite loops
          AND table_name <> 'user_activity_logs'
          -- Convention: Only audit tables that have a primary 'id' column
          AND EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_schema = 'public'
                AND table_name = table_rec.table_name
                AND column_name = 'id'
          )
    LOOP
        -- Drop the trigger if it exists, to make this script re-runnable
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I;',
                       table_rec.table_name || '_log_trigger',
                       table_rec.table_name);

        -- Create the audit trigger
        EXECUTE format('CREATE TRIGGER %I ' ||
                       'AFTER INSERT OR UPDATE OR DELETE ON public.%I ' ||
                       'FOR EACH ROW EXECUTE FUNCTION public.log_data_changes();',
                       table_rec.table_name || '_log_trigger',
                       table_rec.table_name);

        RAISE NOTICE 'Attached audit trigger to %.%', 'public', table_rec.table_name;
    END LOOP;
END;
$$;