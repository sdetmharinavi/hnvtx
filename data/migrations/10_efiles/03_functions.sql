-- path: migrations/10_efiles/03_functions.sql
-- Description: Consolidates all RPC functions for the E-File system.

-- =================================================================
-- Section 1: Core CRUD Functions
-- =================================================================

-- Function to initiate a new file tracking record.
CREATE OR REPLACE FUNCTION public.initiate_e_file(
    p_file_number TEXT, p_subject TEXT, p_description TEXT, 
    p_category TEXT, p_priority TEXT, p_remarks TEXT, 
    p_initiator_employee_id UUID
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_file_id UUID;
BEGIN
    INSERT INTO public.e_files (
        file_number, subject, description, category, priority, 
        initiator_employee_id, current_holder_employee_id, 
        recorded_by_user_id, status
    ) VALUES (
        p_file_number, p_subject, p_description, p_category, p_priority,
        p_initiator_employee_id, p_initiator_employee_id, -- Initially held by initiator
        auth.uid(), 'active'
    ) RETURNING id INTO v_file_id;

    INSERT INTO public.file_movements (
        file_id, from_employee_id, to_employee_id, 
        performed_by_user_id, action_type, remarks
    ) VALUES (
        v_file_id, NULL, p_initiator_employee_id,
        auth.uid(), 'initiated', p_remarks
    );
    RETURN v_file_id;
END;
$$;

-- Function to record the movement of a file between employees.
CREATE OR REPLACE FUNCTION public.forward_e_file(
    p_file_id UUID, p_to_employee_id UUID, p_remarks TEXT, 
    p_action_type TEXT DEFAULT 'forwarded'
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_current_holder_id UUID;
BEGIN
    SELECT current_holder_employee_id INTO v_current_holder_id 
    FROM public.e_files WHERE id = p_file_id FOR UPDATE;
    
    IF NOT FOUND THEN RAISE EXCEPTION 'File not found or you lack permissions to view it.'; END IF;

    UPDATE public.e_files 
    SET current_holder_employee_id = p_to_employee_id, updated_at = NOW()
    WHERE id = p_file_id;

    INSERT INTO public.file_movements (
        file_id, from_employee_id, to_employee_id, 
        performed_by_user_id, action_type, remarks
    ) VALUES (
        p_file_id, v_current_holder_id, p_to_employee_id,
        auth.uid(), p_action_type, p_remarks
    );
END;
$$;

-- Function to close a file, archiving it with its current holder.
CREATE OR REPLACE FUNCTION public.close_e_file(p_file_id UUID, p_remarks TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_current_holder_id UUID;
BEGIN
    SELECT current_holder_employee_id INTO v_current_holder_id 
    FROM public.e_files WHERE id = p_file_id FOR UPDATE;

    IF NOT FOUND THEN RAISE EXCEPTION 'File not found or you lack permissions to view it.'; END IF;

    UPDATE public.e_files 
    SET status = 'closed', updated_at = NOW()
    WHERE id = p_file_id;

    INSERT INTO public.file_movements (
        file_id, from_employee_id, to_employee_id, 
        performed_by_user_id, action_type, remarks
    ) VALUES (
        p_file_id, v_current_holder_id, v_current_holder_id,
        auth.uid(), 'closed', p_remarks
    );
END;
$$;

-- Function to update the metadata of an existing E-File.
CREATE OR REPLACE FUNCTION public.update_e_file_details(
    p_file_id UUID, p_subject TEXT, p_description TEXT, 
    p_category TEXT, p_priority TEXT
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    UPDATE public.e_files
    SET 
        subject = p_subject,
        description = p_description,
        category = p_category,
        priority = p_priority,
        updated_at = NOW()
    WHERE id = p_file_id;
END;
$$;

-- Function to securely delete an E-File record and its history.
CREATE OR REPLACE FUNCTION public.delete_e_file_record(p_file_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
    DELETE FROM public.e_files WHERE id = p_file_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'File not found or already deleted.'; END IF;
END;
$$;

-- =================================================================
-- Section 2: Bulk & Backup/Restore Functions
-- =================================================================

-- Function for bulk importing files and their current state.
CREATE OR REPLACE FUNCTION public.bulk_initiate_e_files(p_files JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
-- ... (The function body from migrations/10_efiles/02_bulk_upload.sql is correct and can be placed here) ...
DECLARE
    file_item JSONB; v_file_id UUID; v_initiator_id UUID; v_current_holder_id UUID;
    v_success_count INT := 0; v_error_count INT := 0; v_errors JSONB := '[]'::JSONB;
    v_app_user_id UUID := auth.uid(); v_remarks TEXT;
BEGIN
    FOR file_item IN SELECT * FROM jsonb_array_elements(p_files) LOOP
        BEGIN
            SELECT id INTO v_initiator_id FROM public.employees WHERE employee_name ILIKE (file_item->>'initiator_name') OR employee_pers_no = (file_item->>'initiator_name') LIMIT 1;
            IF v_initiator_id IS NULL THEN RAISE EXCEPTION 'Initiator "%" not found.', (file_item->>'initiator_name'); END IF;
            v_current_holder_id := v_initiator_id;
            IF file_item->>'current_holder_name' IS NOT NULL AND (file_item->>'current_holder_name') != '' THEN
                SELECT id INTO v_current_holder_id FROM public.employees WHERE employee_name ILIKE (file_item->>'current_holder_name') OR employee_pers_no = (file_item->>'current_holder_name') LIMIT 1;
                IF v_current_holder_id IS NULL THEN RAISE EXCEPTION 'Current Holder "%" not found.', (file_item->>'current_holder_name'); END IF;
            END IF;
            v_remarks := COALESCE(file_item->>'remarks', 'Bulk Uploaded');
            INSERT INTO public.e_files (file_number, subject, description, category, priority, recorded_by_user_id, initiator_employee_id, current_holder_employee_id, status)
            VALUES (file_item->>'file_number', file_item->>'subject', file_item->>'description', file_item->>'category', COALESCE(file_item->>'priority', 'normal'), v_app_user_id, v_initiator_id, v_current_holder_id, 'active')
            RETURNING id INTO v_file_id;
            INSERT INTO public.file_movements (file_id, from_employee_id, to_employee_id, performed_by_user_id, action_type, remarks)
            VALUES (v_file_id, NULL, v_initiator_id, v_app_user_id, 'initiated', 'File Created (Bulk Import)');
            IF v_current_holder_id != v_initiator_id THEN
                INSERT INTO public.file_movements (file_id, from_employee_id, to_employee_id, performed_by_user_id, action_type, remarks)
                VALUES (v_file_id, v_initiator_id, v_current_holder_id, v_app_user_id, 'forwarded', v_remarks);
            END IF;
            v_success_count := v_success_count + 1;
        EXCEPTION WHEN OTHERS THEN
            v_error_count := v_error_count + 1;
            v_errors := v_errors || jsonb_build_object('file_number', file_item->>'file_number', 'error', SQLERRM);
        END;
    END LOOP;
    RETURN jsonb_build_object('success_count', v_success_count, 'error_count', v_error_count, 'errors', v_errors);
END;
$$;

-- Function to export the entire E-File system for backup.
CREATE OR REPLACE FUNCTION public.get_efile_system_backup()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
-- ... (The function body from migrations/10_efiles/06_full_backup_restore.sql is correct and can be placed here) ...
DECLARE v_files JSONB; v_movements JSONB;
BEGIN
    SELECT jsonb_agg(f) INTO v_files FROM (SELECT ef.*, emp_init.employee_pers_no as initiator_pers_no, emp_hold.employee_pers_no as holder_pers_no FROM public.e_files ef LEFT JOIN public.employees emp_init ON ef.initiator_employee_id = emp_init.id LEFT JOIN public.employees emp_hold ON ef.current_holder_employee_id = emp_hold.id) f;
    SELECT jsonb_agg(m) INTO v_movements FROM (SELECT fm.action_type, fm.remarks, fm.created_at, ef.file_number, emp_from.employee_pers_no as from_pers_no, emp_to.employee_pers_no as to_pers_no, au.email as performed_by_email FROM public.file_movements fm JOIN public.e_files ef ON fm.file_id = ef.id LEFT JOIN public.employees emp_from ON fm.from_employee_id = emp_from.id LEFT JOIN public.employees emp_to ON fm.to_employee_id = emp_to.id LEFT JOIN auth.users au ON fm.performed_by_user_id = au.id ORDER BY fm.created_at ASC) m;
    RETURN jsonb_build_object('files', COALESCE(v_files, '[]'::jsonb), 'movements', COALESCE(v_movements, '[]'::jsonb));
END;
$$;

-- Function to restore the entire E-File system from a backup.
CREATE OR REPLACE FUNCTION public.restore_efile_system_backup(p_files JSONB, p_movements JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
-- ... (The function body from migrations/10_efiles/06_full_backup_restore.sql is correct and can be placed here) ...
DECLARE
    file_item JSONB; mov_item JSONB; v_file_id UUID; v_initiator_id UUID; v_holder_id UUID; v_from_id UUID; v_to_id UUID; v_performer_id UUID;
    v_files_processed INT := 0; v_movements_processed INT := 0; v_errors JSONB := '[]'::JSONB;
BEGIN
    FOR file_item IN SELECT * FROM jsonb_array_elements(p_files) LOOP
        BEGIN
            SELECT id INTO v_initiator_id FROM public.employees WHERE employee_pers_no = file_item->>'initiator_pers_no';
            SELECT id INTO v_holder_id FROM public.employees WHERE employee_pers_no = file_item->>'holder_pers_no';
            IF v_initiator_id IS NULL THEN RAISE EXCEPTION 'Initiator not found for file %', file_item->>'file_number'; END IF;
            IF v_holder_id IS NULL THEN v_holder_id := v_initiator_id; END IF;
            INSERT INTO public.e_files (file_number, subject, description, category, priority, status, initiator_employee_id, current_holder_employee_id, recorded_by_user_id, created_at, updated_at)
            VALUES (file_item->>'file_number', file_item->>'subject', file_item->>'description', file_item->>'category', file_item->>'priority', file_item->>'status', v_initiator_id, v_holder_id, auth.uid(), (file_item->>'created_at')::timestamptz, (file_item->>'updated_at')::timestamptz)
            ON CONFLICT (file_number) DO UPDATE SET subject = EXCLUDED.subject, description = EXCLUDED.description, current_holder_employee_id = EXCLUDED.current_holder_employee_id, status = EXCLUDED.status, updated_at = EXCLUDED.updated_at;
            v_files_processed := v_files_processed + 1;
        EXCEPTION WHEN OTHERS THEN v_errors := v_errors || jsonb_build_object('type', 'file', 'key', file_item->>'file_number', 'error', SQLERRM);
        END;
    END LOOP;
    FOR mov_item IN SELECT * FROM jsonb_array_elements(p_movements) LOOP
        BEGIN
            SELECT id INTO v_file_id FROM public.e_files WHERE file_number = mov_item->>'file_number';
            IF v_file_id IS NULL THEN CONTINUE; END IF;
            v_from_id := NULL;
            IF mov_item->>'from_pers_no' IS NOT NULL THEN SELECT id INTO v_from_id FROM public.employees WHERE employee_pers_no = mov_item->>'from_pers_no'; END IF;
            SELECT id INTO v_to_id FROM public.employees WHERE employee_pers_no = mov_item->>'to_pers_no';
            SELECT id INTO v_performer_id FROM auth.users WHERE email = mov_item->>'performed_by_email';
            IF v_performer_id IS NULL THEN v_performer_id := auth.uid(); END IF;
            IF NOT EXISTS (SELECT 1 FROM public.file_movements WHERE file_id = v_file_id AND action_type = mov_item->>'action_type' AND created_at = (mov_item->>'created_at')::timestamptz) THEN
                INSERT INTO public.file_movements (file_id, from_employee_id, to_employee_id, performed_by_user_id, action_type, remarks, created_at)
                VALUES (v_file_id, v_from_id, v_to_id, v_performer_id, mov_item->>'action_type', mov_item->>'remarks', (mov_item->>'created_at')::timestamptz);
                v_movements_processed := v_movements_processed + 1;
            END IF;
        EXCEPTION WHEN OTHERS THEN v_errors := v_errors || jsonb_build_object('type', 'movement', 'key', mov_item->>'file_number', 'error', SQLERRM);
        END;
    END LOOP;
    RETURN jsonb_build_object('files_processed', v_files_processed, 'movements_processed', v_movements_processed, 'errors', v_errors);
END;
$$;
