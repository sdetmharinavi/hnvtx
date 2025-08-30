-- REFACTORED: This script now automatically attaches the log_data_changes trigger
-- to all tables in the public schema that have an 'id' column and are not logs themselves.

DO $$
DECLARE
    table_rec RECORD;
    trigger_name text;
BEGIN
    -- Loop through all user tables in the 'public' schema
    FOR table_rec IN
        SELECT t.table_name
        FROM information_schema.tables t
        WHERE t.table_schema = 'public'
          AND t.table_type = 'BASE TABLE'
          AND t.table_name <> 'user_activity_logs'
          AND EXISTS (
              SELECT 1
              FROM information_schema.columns c
              WHERE c.table_schema = 'public'
                AND c.table_name = t.table_name
                AND c.column_name = 'id'
          )
    LOOP
        trigger_name := table_rec.table_name || '_log_trigger';

        -- Only create the trigger if it does not already exist
        IF NOT EXISTS (
            SELECT 1
            FROM pg_trigger trg
            JOIN pg_class cls ON trg.tgrelid = cls.oid
            JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
            WHERE trg.tgname = trigger_name
              AND nsp.nspname = 'public'
              AND cls.relname = table_rec.table_name
        ) THEN
            EXECUTE format('CREATE TRIGGER %I ' ||
                           'AFTER INSERT OR UPDATE OR DELETE ON public.%I ' ||
                           'FOR EACH ROW EXECUTE FUNCTION public.log_data_changes();',
                           trigger_name,
                           table_rec.table_name);

            RAISE NOTICE 'Created audit trigger on %.%', 'public', table_rec.table_name;
        ELSE
            RAISE NOTICE 'Trigger already exists on %.%, skipping.', 'public', table_rec.table_name;
        END IF;
    END LOOP;
END;
$$;
