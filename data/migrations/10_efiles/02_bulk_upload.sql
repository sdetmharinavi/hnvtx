-- path: data/migrations/10_efiles/02_bulk_upload.sql
-- Description: Enhanced bulk upload that restores "Current Holder" state.

CREATE OR REPLACE FUNCTION public.bulk_initiate_e_files(
    p_files JSONB -- Array: { file_number, subject, description, category, priority, remarks, initiator_name, current_holder_name? }
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    file_item JSONB;
    v_file_id UUID;
    v_initiator_id UUID;
    v_current_holder_id UUID;
    v_success_count INT := 0;
    v_error_count INT := 0;
    v_errors JSONB := '[]'::JSONB;
    v_app_user_id UUID := auth.uid();
    v_remarks TEXT;
BEGIN
    FOR file_item IN SELECT * FROM jsonb_array_elements(p_files)
    LOOP
        BEGIN
            -- 1. Find Initiator
            SELECT id INTO v_initiator_id 
            FROM public.employees 
            WHERE employee_name ILIKE (file_item->>'initiator_name') 
               OR employee_pers_no = (file_item->>'initiator_name')
            LIMIT 1;

            IF v_initiator_id IS NULL THEN
                 RAISE EXCEPTION 'Initiator "%" not found.', (file_item->>'initiator_name');
            END IF;

            -- 2. Find Current Holder (Optional)
            v_current_holder_id := v_initiator_id; -- Default to initiator
            
            IF file_item->>'current_holder_name' IS NOT NULL AND (file_item->>'current_holder_name') != '' THEN
                SELECT id INTO v_current_holder_id 
                FROM public.employees 
                WHERE employee_name ILIKE (file_item->>'current_holder_name') 
                   OR employee_pers_no = (file_item->>'current_holder_name')
                LIMIT 1;

                IF v_current_holder_id IS NULL THEN
                     -- Warning: fallback to initiator if holder not found, but log it? 
                     -- For now, fail safe to initiator or raise error? Let's raise error to ensure data integrity.
                     RAISE EXCEPTION 'Current Holder "%" not found.', (file_item->>'current_holder_name');
                END IF;
            END IF;

            v_remarks := COALESCE(file_item->>'remarks', 'Bulk Uploaded');

            -- 3. Insert File Record
            -- Note: We set current_holder_employee_id to the FINAL destination immediately
            INSERT INTO public.e_files (
                file_number, 
                subject, 
                description, 
                category, 
                priority, 
                recorded_by_user_id,
                initiator_employee_id, 
                current_holder_employee_id, -- Set directly to final holder
                status
            ) VALUES (
                file_item->>'file_number',
                file_item->>'subject',
                file_item->>'description',
                file_item->>'category',
                COALESCE(file_item->>'priority', 'normal'),
                v_app_user_id,
                v_initiator_id,
                v_current_holder_id, 
                'active'
            ) RETURNING id INTO v_file_id;

            -- 4. Log Initial Movement (Initiated by A)
            INSERT INTO public.file_movements (
                file_id, from_employee_id, to_employee_id, performed_by_user_id, action_type, remarks
            ) VALUES (
                v_file_id, NULL, v_initiator_id, v_app_user_id, 'initiated', 'File Created (Bulk Import)'
            );

            -- 5. If Holder != Initiator, Log a Forwarding Movement (A -> B)
            IF v_current_holder_id != v_initiator_id THEN
                INSERT INTO public.file_movements (
                    file_id, from_employee_id, to_employee_id, performed_by_user_id, action_type, remarks
                ) VALUES (
                    v_file_id, v_initiator_id, v_current_holder_id, v_app_user_id, 'forwarded', v_remarks
                );
            END IF;

            v_success_count := v_success_count + 1;

        EXCEPTION WHEN OTHERS THEN
            v_error_count := v_error_count + 1;
            v_errors := v_errors || jsonb_build_object(
                'file_number', file_item->>'file_number',
                'error', SQLERRM
            );
        END;
    END LOOP;

    RETURN jsonb_build_object(
        'success_count', v_success_count,
        'error_count', v_error_count,
        'errors', v_errors
    );
END;
$$;