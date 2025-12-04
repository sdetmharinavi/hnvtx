-- path: data/migrations/10_efiles/01_rebuild_efiles_employee_centric.sql
-- Description: Rebuilds the E-File system to track physical files moving between EMPLOYEES.
-- App Users (auth.users) are now tracked only as the "recorder" of the data.

BEGIN;

-- 1. Cleanup Old Objects
DROP VIEW IF EXISTS public.v_file_movements_extended;
DROP VIEW IF EXISTS public.v_e_files_extended;
DROP TABLE IF EXISTS public.file_movements;
DROP TABLE IF EXISTS public.e_files;

-- 2. Create E-Files Master Table
CREATE TABLE public.e_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_number TEXT NOT NULL UNIQUE,
    subject TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL, 
    priority TEXT DEFAULT 'normal', -- 'normal', 'urgent', 'immediate'
    
    -- The Employee who physically started/owns the file
    initiator_employee_id UUID NOT NULL REFERENCES public.employees(id),
    
    -- The Employee currently holding the physical file
    current_holder_employee_id UUID NOT NULL REFERENCES public.employees(id),
    
    -- The App User who performed the data entry
    recorded_by_user_id UUID NOT NULL REFERENCES auth.users(id),
    
    status TEXT DEFAULT 'active', -- 'active', 'closed'
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Movements History Table
CREATE TABLE public.file_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES public.e_files(id) ON DELETE CASCADE,
    
    -- Movement: From Employee -> To Employee
    from_employee_id UUID REFERENCES public.employees(id),
    to_employee_id UUID NOT NULL REFERENCES public.employees(id),
    
    -- The App User who clicked the button
    performed_by_user_id UUID NOT NULL REFERENCES auth.users(id) DEFAULT auth.uid(),
    
    action_type TEXT NOT NULL, -- 'initiated', 'forwarded', 'returned', 'closed'
    remarks TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Indexes
CREATE INDEX idx_e_files_holder ON public.e_files(current_holder_employee_id);
CREATE INDEX idx_e_files_file_number ON public.e_files(file_number);
CREATE INDEX idx_file_movements_file_id ON public.file_movements(file_id);

-- 5. Enable RLS
ALTER TABLE public.e_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_movements ENABLE ROW LEVEL SECURITY;

-- 6. Policies (Simplified for Record Keeping Mode)
-- Since App Users are operators managing files for Employees, they generally need broad read access.

-- E-Files Policies
CREATE POLICY "Authenticated users can view e_files" 
ON public.e_files FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert e_files" 
ON public.e_files FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update e_files" 
ON public.e_files FOR UPDATE 
TO authenticated 
USING (true);

-- File Movements Policies
CREATE POLICY "Authenticated users can view movements" 
ON public.file_movements FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert movements" 
ON public.file_movements FOR INSERT 
TO authenticated 
WITH CHECK (true);


-- 7. Views (Enhanced with Employee Data)

-- View: Extended E-Files List
CREATE OR REPLACE VIEW public.v_e_files_extended WITH (security_invoker = true) AS
SELECT 
    f.id,
    f.file_number,
    f.subject,
    f.description,
    f.category,
    f.priority,
    f.status,
    f.created_at,
    f.updated_at,
    
    -- Initiator (Employee)
    f.initiator_employee_id,
    e_init.employee_name as initiator_name,
    d_init.name as initiator_designation,
    
    -- Current Holder (Employee)
    f.current_holder_employee_id,
    e_hold.employee_name as current_holder_name,
    d_hold.name as current_holder_designation,
    m_hold.name as current_holder_area,
    
    -- Recorded By (App User)
    f.recorded_by_user_id,
    p_rec.first_name || ' ' || p_rec.last_name as recorded_by_name
    
FROM public.e_files f
LEFT JOIN public.employees e_init ON f.initiator_employee_id = e_init.id
LEFT JOIN public.employee_designations d_init ON e_init.employee_designation_id = d_init.id
LEFT JOIN public.employees e_hold ON f.current_holder_employee_id = e_hold.id
LEFT JOIN public.employee_designations d_hold ON e_hold.employee_designation_id = d_hold.id
LEFT JOIN public.maintenance_areas m_hold ON e_hold.maintenance_terminal_id = m_hold.id
LEFT JOIN public.user_profiles p_rec ON f.recorded_by_user_id = p_rec.id;

-- View: Extended Movements History
CREATE OR REPLACE VIEW public.v_file_movements_extended WITH (security_invoker = true) AS
SELECT
    m.id,
    m.file_id,
    m.action_type,
    m.remarks,
    m.created_at,
    
    -- From Employee
    m.from_employee_id,
    e_from.employee_name as from_employee_name,
    d_from.name as from_employee_designation,
    
    -- To Employee
    m.to_employee_id,
    e_to.employee_name as to_employee_name,
    d_to.name as to_employee_designation,
    
    -- Operator
    m.performed_by_user_id,
    p_op.first_name || ' ' || p_op.last_name as performed_by_name

FROM public.file_movements m
LEFT JOIN public.employees e_from ON m.from_employee_id = e_from.id
LEFT JOIN public.employee_designations d_from ON e_from.employee_designation_id = d_from.id
LEFT JOIN public.employees e_to ON m.to_employee_id = e_to.id
LEFT JOIN public.employee_designations d_to ON e_to.employee_designation_id = d_to.id
LEFT JOIN public.user_profiles p_op ON m.performed_by_user_id = p_op.id
ORDER BY m.created_at DESC;


-- 8. RPC Functions (Transactional Logic)

-- Function: Initiate File
CREATE OR REPLACE FUNCTION public.initiate_e_file(
    p_file_number TEXT,
    p_subject TEXT,
    p_description TEXT,
    p_category TEXT,
    p_priority TEXT,
    p_remarks TEXT,
    p_initiator_employee_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_file_id UUID;
BEGIN
    -- 1. Insert File Record
    INSERT INTO public.e_files (
        file_number, subject, description, category, priority, 
        initiator_employee_id, current_holder_employee_id, 
        recorded_by_user_id, status
    ) VALUES (
        p_file_number, p_subject, p_description, p_category, p_priority,
        p_initiator_employee_id, p_initiator_employee_id, -- Initially held by initiator
        auth.uid(), 'active'
    ) RETURNING id INTO v_file_id;

    -- 2. Log 'Initiated' Movement
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

-- Function: Forward File
CREATE OR REPLACE FUNCTION public.forward_e_file(
    p_file_id UUID,
    p_to_employee_id UUID,
    p_remarks TEXT,
    p_action_type TEXT DEFAULT 'forwarded'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_holder_id UUID;
BEGIN
    -- Get current holder
    SELECT current_holder_employee_id INTO v_current_holder_id 
    FROM public.e_files WHERE id = p_file_id;
    
    IF v_current_holder_id IS NULL THEN RAISE EXCEPTION 'File not found'; END IF;

    -- Update File Holder
    UPDATE public.e_files 
    SET current_holder_employee_id = p_to_employee_id, updated_at = NOW()
    WHERE id = p_file_id;

    -- Log Movement
    INSERT INTO public.file_movements (
        file_id, from_employee_id, to_employee_id, 
        performed_by_user_id, action_type, remarks
    ) VALUES (
        p_file_id, v_current_holder_id, p_to_employee_id,
        auth.uid(), p_action_type, p_remarks
    );
END;
$$;

-- Function: Close File (Archives it with current holder)
CREATE OR REPLACE FUNCTION public.close_e_file(
    p_file_id UUID,
    p_remarks TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_holder_id UUID;
BEGIN
    SELECT current_holder_employee_id INTO v_current_holder_id 
    FROM public.e_files WHERE id = p_file_id;

    -- Update Status
    UPDATE public.e_files 
    SET status = 'closed', updated_at = NOW()
    WHERE id = p_file_id;

    -- Log Closing Action (To same user, just marks status change)
    INSERT INTO public.file_movements (
        file_id, from_employee_id, to_employee_id, 
        performed_by_user_id, action_type, remarks
    ) VALUES (
        p_file_id, v_current_holder_id, v_current_holder_id,
        auth.uid(), 'closed', p_remarks
    );
END;
$$;

-- 9. Grant Permissions
GRANT SELECT, INSERT, UPDATE ON public.e_files TO authenticated;
GRANT SELECT, INSERT ON public.file_movements TO authenticated;
GRANT SELECT ON public.v_e_files_extended TO authenticated;
GRANT SELECT ON public.v_file_movements_extended TO authenticated;
GRANT EXECUTE ON FUNCTION public.initiate_e_file TO authenticated;
GRANT EXECUTE ON FUNCTION public.forward_e_file TO authenticated;
GRANT EXECUTE ON FUNCTION public.close_e_file TO authenticated;

COMMIT;