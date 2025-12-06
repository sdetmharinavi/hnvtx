-- path: data/migrations/10_efiles/06_full_backup_restore.sql
-- Description: Functions for full E-File System Backup & Restore (Master + History).

-- 1. EXPORT FUNCTION
-- Returns a JSON object containing all files and their full movement history.
CREATE OR REPLACE FUNCTION public.get_efile_system_backup()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_files JSONB;
    v_movements JSONB;
BEGIN
    -- Fetch Files (Master Data)
    -- We use the view to get readable names, but we need raw IDs for perfect restoration if available.
    -- However, for portability, we rely on 'file_number' as the key and 'employee_pers_no' or 'email' for users.
    SELECT jsonb_agg(f) INTO v_files FROM (
        SELECT 
            ef.*, 
            emp_init.employee_pers_no as initiator_pers_no,
            emp_hold.employee_pers_no as holder_pers_no
        FROM public.e_files ef
        LEFT JOIN public.employees emp_init ON ef.initiator_employee_id = emp_init.id
        LEFT JOIN public.employees emp_hold ON ef.current_holder_employee_id = emp_hold.id
    ) f;

    -- Fetch Movements (History Data)
    -- We link movements to files via 'file_number' instead of UUID to make the Excel readable/portable.
    SELECT jsonb_agg(m) INTO v_movements FROM (
        SELECT 
            fm.action_type,
            fm.remarks,
            fm.created_at,
            ef.file_number, -- Key to link back to file
            emp_from.employee_pers_no as from_pers_no,
            emp_to.employee_pers_no as to_pers_no,
            au.email as performed_by_email
        FROM public.file_movements fm
        JOIN public.e_files ef ON fm.file_id = ef.id
        LEFT JOIN public.employees emp_from ON fm.from_employee_id = emp_from.id
        LEFT JOIN public.employees emp_to ON fm.to_employee_id = emp_to.id
        LEFT JOIN auth.users au ON fm.performed_by_user_id = au.id
        ORDER BY fm.created_at ASC
    ) m;

    RETURN jsonb_build_object(
        'files', COALESCE(v_files, '[]'::jsonb),
        'movements', COALESCE(v_movements, '[]'::jsonb)
    );
END;
$$;

-- 2. IMPORT/RESTORE FUNCTION
CREATE OR REPLACE FUNCTION public.restore_efile_system_backup(
    p_files JSONB,     -- Array of file objects
    p_movements JSONB  -- Array of movement objects
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    file_item JSONB;
    mov_item JSONB;
    
    v_file_id UUID;
    v_initiator_id UUID;
    v_holder_id UUID;
    v_from_id UUID;
    v_to_id UUID;
    v_performer_id UUID;
    
    v_files_processed INT := 0;
    v_movements_processed INT := 0;
    v_errors JSONB := '[]'::JSONB;
BEGIN
    -- A. Process Files First
    FOR file_item IN SELECT * FROM jsonb_array_elements(p_files)
    LOOP
        BEGIN
            -- Resolve IDs from Personal Numbers (Portable)
            SELECT id INTO v_initiator_id FROM public.employees WHERE employee_pers_no = file_item->>'initiator_pers_no';
            SELECT id INTO v_holder_id FROM public.employees WHERE employee_pers_no = file_item->>'holder_pers_no';
            
            -- Fallback to current user if IDs missing (safe default)
            IF v_initiator_id IS NULL THEN RAISE EXCEPTION 'Initiator not found for file %', file_item->>'file_number'; END IF;
            IF v_holder_id IS NULL THEN v_holder_id := v_initiator_id; END IF;

            INSERT INTO public.e_files (
                file_number, subject, description, category, priority, status,
                initiator_employee_id, current_holder_employee_id, recorded_by_user_id,
                created_at, updated_at
            ) VALUES (
                file_item->>'file_number',
                file_item->>'subject',
                file_item->>'description',
                file_item->>'category',
                file_item->>'priority',
                file_item->>'status',
                v_initiator_id,
                v_holder_id,
                auth.uid(), -- Recorder is current user
                (file_item->>'created_at')::timestamptz,
                (file_item->>'updated_at')::timestamptz
            )
            ON CONFLICT (file_number) DO UPDATE SET
                subject = EXCLUDED.subject,
                description = EXCLUDED.description,
                current_holder_employee_id = EXCLUDED.current_holder_employee_id,
                status = EXCLUDED.status,
                updated_at = EXCLUDED.updated_at;
                
            v_files_processed := v_files_processed + 1;
        EXCEPTION WHEN OTHERS THEN
             v_errors := v_errors || jsonb_build_object('type', 'file', 'key', file_item->>'file_number', 'error', SQLERRM);
        END;
    END LOOP;

    -- B. Process Movements
    FOR mov_item IN SELECT * FROM jsonb_array_elements(p_movements)
    LOOP
        BEGIN
            -- 1. Find the File ID using File Number
            SELECT id INTO v_file_id FROM public.e_files WHERE file_number = mov_item->>'file_number';
            
            IF v_file_id IS NULL THEN 
                CONTINUE; -- Skip movement if file doesn't exist
            END IF;

            -- 2. Resolve Employee IDs
            v_from_id := NULL;
            IF mov_item->>'from_pers_no' IS NOT NULL THEN
                SELECT id INTO v_from_id FROM public.employees WHERE employee_pers_no = mov_item->>'from_pers_no';
            END IF;
            
            SELECT id INTO v_to_id FROM public.employees WHERE employee_pers_no = mov_item->>'to_pers_no';
            
            -- 3. Resolve User ID (Best effort via email, else current user)
            SELECT id INTO v_performer_id FROM auth.users WHERE email = mov_item->>'performed_by_email';
            IF v_performer_id IS NULL THEN v_performer_id := auth.uid(); END IF;

            -- 4. Insert Movement (Avoid duplicates based on timestamp/file/action)
            -- Note: We don't have a unique constraint on movements, so we do a check first.
            IF NOT EXISTS (
                SELECT 1 FROM public.file_movements 
                WHERE file_id = v_file_id 
                  AND action_type = mov_item->>'action_type'
                  AND created_at = (mov_item->>'created_at')::timestamptz
            ) THEN
                INSERT INTO public.file_movements (
                    file_id, from_employee_id, to_employee_id, performed_by_user_id,
                    action_type, remarks, created_at
                ) VALUES (
                    v_file_id, v_from_id, v_to_id, v_performer_id,
                    mov_item->>'action_type', mov_item->>'remarks', (mov_item->>'created_at')::timestamptz
                );
                v_movements_processed := v_movements_processed + 1;
            END IF;

        EXCEPTION WHEN OTHERS THEN
             v_errors := v_errors || jsonb_build_object('type', 'movement', 'key', mov_item->>'file_number', 'error', SQLERRM);
        END;
    END LOOP;

    RETURN jsonb_build_object(
        'files_processed', v_files_processed,
        'movements_processed', v_movements_processed,
        'errors', v_errors
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_efile_system_backup() TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_efile_system_backup(JSONB, JSONB) TO authenticated;