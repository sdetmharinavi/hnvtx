-- path: migrations/10_efiles/02_views.sql
-- Description: Defines denormalized views for the E-File system.

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
    
    -- Initiator (Employee) Details
    f.initiator_employee_id,
    e_init.employee_name as initiator_name,
    d_init.name as initiator_designation,
    
    -- Current Holder (Employee) Details
    f.current_holder_employee_id,
    e_hold.employee_name as current_holder_name,
    d_hold.name as current_holder_designation,
    m_hold.name as current_holder_area,
    
    -- Recorded By (App User) Details
    f.recorded_by_user_id,
    p_rec.full_name as recorded_by_name
    
FROM public.e_files f
LEFT JOIN public.employees e_init ON f.initiator_employee_id = e_init.id
LEFT JOIN public.employee_designations d_init ON e_init.employee_designation_id = d_init.id
LEFT JOIN public.employees e_hold ON f.current_holder_employee_id = e_hold.id
LEFT JOIN public.employee_designations d_hold ON e_hold.employee_designation_id = d_hold.id
LEFT JOIN public.maintenance_areas m_hold ON e_hold.maintenance_terminal_id = m_hold.id
LEFT JOIN public.v_user_profiles_extended p_rec ON f.recorded_by_user_id = p_rec.id;

-- View: Extended Movements History
CREATE OR REPLACE VIEW public.v_file_movements_extended WITH (security_invoker = true) AS
SELECT
    m.id,
    m.file_id,
    m.action_type,
    m.remarks,
    m.created_at,
    
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
ORDER BY m.created_at DESC;