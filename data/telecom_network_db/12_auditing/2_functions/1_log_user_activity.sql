--===== telecom_network_db/12_auditing/2_functions/1_log_user_activity.sql =====
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