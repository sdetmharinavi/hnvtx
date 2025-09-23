-- Path: migrations/05_auditing/02_functions.sql
-- Description: Core functions for the auditing system.

-- Function 1: log_user_activity()
-- This is the generic logging function that inserts a record into the audit table.
-- It can be called directly for custom actions or by the trigger function for data changes.
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
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.user_activity_logs (
        user_id,
        user_role,
        action_type,
        table_name,
        record_id,
        old_data,
        new_data,
        details
    )
    VALUES (
        auth.uid(),
        public.get_my_role(),
        p_action_type,
        p_table_name,
        p_record_id,
        p_old_data,
        p_new_data,
        p_details
    );
END;
$$;


-- Function 2: log_data_changes()
-- This is the TRIGGER function that will be attached to tables.
-- It captures INSERT, UPDATE, DELETE events and calls log_user_activity() with the correct data.
CREATE OR REPLACE FUNCTION public.log_data_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_record_id TEXT;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        v_record_id := NEW.id::TEXT;
        PERFORM public.log_user_activity(
            'INSERT',
            TG_TABLE_NAME,
            v_record_id,
            NULL,
            row_to_json(NEW)::jsonb
        );
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        v_record_id := NEW.id::TEXT;
        PERFORM public.log_user_activity(
            'UPDATE',
            TG_TABLE_NAME,
            v_record_id,
            row_to_json(OLD)::jsonb,
            row_to_json(NEW)::jsonb
        );
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        v_record_id := OLD.id::TEXT;
        PERFORM public.log_user_activity(
            'DELETE',
            TG_TABLE_NAME,
            v_record_id,
            row_to_json(OLD)::jsonb,
            NULL
        );
        RETURN OLD;
    END IF;
    -- This line is unreachable in an AFTER trigger but is good practice.
    RETURN NULL;
END;
$$;