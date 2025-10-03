-- path: data/migrations/06_utilities/07_attach_updated_at_triggers.sql
-- Description: Dynamically attaches the 'update_updated_at_column' trigger to all tables that have an 'updated_at' column.

DO $$
DECLARE
    table_rec RECORD;
    trigger_name TEXT;
BEGIN
    -- Loop through all tables in the 'public' schema
    FOR table_rec IN
        SELECT t.table_name
        FROM information_schema.tables t
        WHERE t.table_schema = 'public'
          AND t.table_type = 'BASE TABLE'
          -- **Key Condition: Only act on tables that actually have an 'updated_at' column.**
          AND EXISTS (
              SELECT 1
              FROM information_schema.columns c
              WHERE c.table_schema = t.table_schema
                AND c.table_name = t.table_name
                AND c.column_name = 'updated_at'
          )
    LOOP
        -- Create a standardized trigger name
        trigger_name := 'trigger_' || table_rec.table_name || '_updated_at';

        -- Drop the trigger if it already exists to ensure it's up-to-date
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I;', trigger_name, table_rec.table_name);

        -- Create the new trigger
        EXECUTE format('CREATE TRIGGER %I ' ||
                       'BEFORE UPDATE ON public.%I ' ||
                       'FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();',
                       trigger_name,
                       table_rec.table_name);

        RAISE NOTICE 'Attached/Refreshed updated_at trigger on table: public.%', table_rec.table_name;
    END LOOP;
END;
$$;