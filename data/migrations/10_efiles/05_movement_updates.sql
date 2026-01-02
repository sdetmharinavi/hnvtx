-- path: data/migrations/10_efiles/05_movement_updates.sql
-- Description: Adds action_date to movements, updates views, and adds editing capabilities.

-- 1. Add action_date column (Defaults to created_at logic if not provided)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'file_movements' AND column_name = 'action_date') THEN
        ALTER TABLE public.file_movements ADD COLUMN action_date TIMESTAMPTZ DEFAULT NOW();
        -- Backfill existing data
        UPDATE public.file_movements SET action_date = created_at WHERE action_date IS NULL;
    END IF;
END $$;

DROP view public.v_file_movements_extended;

-- 2. Update the View to include action_date
CREATE OR REPLACE VIEW public.v_file_movements_extended WITH (security_invoker = true) AS
SELECT
    m.id,
    m.file_id,
    m.action_type,
    m.remarks,
    m.created_at,
    m.action_date, -- Added Field
    
    -- From Employee Details
    m.from_employee_id,
    e_from.employee_name as from_employee_name,
    d_from.name as from_employee_designation,
    
    -- To Employee Details
    m.to_employee_id,
    e_to.employee_name as to_employee_name,
    d_to.name as to_employee_designation,
    
    -- Operator (App User) Details
    m.performed_by_user_id,
    p_op.full_name as performed_by_name

FROM public.file_movements m
LEFT JOIN public.employees e_from ON m.from_employee_id = e_from.id
LEFT JOIN public.employee_designations d_from ON e_from.employee_designation_id = d_from.id
LEFT JOIN public.employees e_to ON m.to_employee_id = e_to.id
LEFT JOIN public.employee_designations d_to ON e_to.employee_designation_id = d_to.id
LEFT JOIN public.v_user_profiles_extended p_op ON m.performed_by_user_id = p_op.id
ORDER BY m.action_date DESC, m.created_at DESC; -- Sort by action_date now

-- 3. Update Forward RPC to accept action_date
CREATE OR REPLACE FUNCTION public.forward_e_file(
    p_file_id UUID, 
    p_to_employee_id UUID, 
    p_remarks TEXT, 
    p_action_type TEXT DEFAULT 'forwarded',
    p_action_date TIMESTAMPTZ DEFAULT NOW() -- New Param
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_current_holder_id UUID;
BEGIN
    SELECT current_holder_employee_id INTO v_current_holder_id 
    FROM public.e_files WHERE id = p_file_id FOR UPDATE;
    
    IF NOT FOUND THEN RAISE EXCEPTION 'File not found or you lack permissions to view it.'; END IF;

    -- Update File Holder
    UPDATE public.e_files 
    SET current_holder_employee_id = p_to_employee_id, updated_at = NOW()
    WHERE id = p_file_id;

    -- Log Movement
    INSERT INTO public.file_movements (
        file_id, from_employee_id, to_employee_id, 
        performed_by_user_id, action_type, remarks, action_date
    ) VALUES (
        p_file_id, v_current_holder_id, p_to_employee_id,
        auth.uid(), p_action_type, p_remarks, p_action_date
    );
END;
$$;

-- 4. Update Initiate RPC to accept action_date (Optional but good for consistency)
CREATE OR REPLACE FUNCTION public.initiate_e_file(
    p_file_number TEXT, p_subject TEXT, p_description TEXT, 
    p_category TEXT, p_priority TEXT, p_remarks TEXT, 
    p_initiator_employee_id UUID,
    p_action_date TIMESTAMPTZ DEFAULT NOW() -- New Param
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
        p_initiator_employee_id, p_initiator_employee_id, 
        auth.uid(), 'active'
    ) RETURNING id INTO v_file_id;

    INSERT INTO public.file_movements (
        file_id, from_employee_id, to_employee_id, 
        performed_by_user_id, action_type, remarks, action_date
    ) VALUES (
        v_file_id, NULL, p_initiator_employee_id,
        auth.uid(), 'initiated', p_remarks, p_action_date
    );
    RETURN v_file_id;
END;
$$;

-- 5. NEW RPC: Update existing movement
CREATE OR REPLACE FUNCTION public.update_file_movement(
    p_movement_id UUID,
    p_remarks TEXT,
    p_action_date TIMESTAMPTZ
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    -- Only allow editing if the user is authenticated (RLS handles ownership checks usually, but here we assume admin/operator access)
    UPDATE public.file_movements
    SET 
        remarks = p_remarks,
        action_date = p_action_date
    WHERE id = p_movement_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Movement record not found.';
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_file_movement(UUID, TEXT, TIMESTAMPTZ) TO authenticated;