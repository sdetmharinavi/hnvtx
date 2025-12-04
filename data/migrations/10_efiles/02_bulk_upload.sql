-- path: data/migrations/10_efiles/02_bulk_upload_employee.sql
-- Description: Re-implements bulk upload for the Employee-centric E-File system.

CREATE OR REPLACE FUNCTION public.bulk_initiate_e_files(
    p_files JSONB -- Array of objects: { file_number, subject, description, category, priority, remarks, initiator_name }
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    file_item JSONB;
    v_file_id UUID;
    v_initiator_id UUID;
    v_success_count INT := 0;
    v_error_count INT := 0;
    v_errors JSONB := '[]'::JSONB;
    v_app_user_id UUID := auth.uid();
BEGIN
    FOR file_item IN SELECT * FROM jsonb_array_elements(p_files)
    LOOP
        BEGIN
            -- 1. Resolve Initiator Employee ID
            -- We try to find an employee matching the 'initiator_name' provided in Excel.
            -- It checks against 'employee_name' OR 'employee_pers_no'.
            IF file_item->>'initiator_name' IS NOT NULL AND file_item->>'initiator_name' != '' THEN
                SELECT id INTO v_initiator_id 
                FROM public.employees 
                WHERE employee_name ILIKE (file_item->>'initiator_name') 
                   OR employee_pers_no = (file_item->>'initiator_name')
                LIMIT 1;
            END IF;

            -- Validation: If we can't find the employee, we can't create the file.
            IF v_initiator_id IS NULL THEN
                 RAISE EXCEPTION 'Employee "%" not found. Please ensure the Initiator exists in the Employee database first.', (file_item->>'initiator_name');
            END IF;

            -- 2. Insert File (Employee is both initiator and current holder)
            INSERT INTO public.e_files (
                file_number, 
                subject, 
                description, 
                category, 
                priority, 
                recorded_by_user_id, -- The logged-in App User entering data
                initiator_employee_id, 
                current_holder_employee_id, 
                status
            ) VALUES (
                file_item->>'file_number',
                file_item->>'subject',
                file_item->>'description',
                file_item->>'category',
                COALESCE(file_item->>'priority', 'normal'),
                v_app_user_id,
                v_initiator_id,
                v_initiator_id, 
                'active'
            ) RETURNING id INTO v_file_id;

            -- 3. Log Initial Movement
            INSERT INTO public.file_movements (
                file_id, 
                from_employee_id, 
                to_employee_id, 
                performed_by_user_id,
                action_type, 
                remarks
            ) VALUES (
                v_file_id, 
                NULL, 
                v_initiator_id, 
                v_app_user_id,
                'initiated', 
                COALESCE(file_item->>'remarks', 'Bulk Uploaded')
            );

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

GRANT EXECUTE ON FUNCTION public.bulk_initiate_e_files(JSONB) TO authenticated;