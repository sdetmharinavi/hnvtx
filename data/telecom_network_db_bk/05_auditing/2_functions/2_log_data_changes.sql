
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
    RETURN NULL;
END;
$$;