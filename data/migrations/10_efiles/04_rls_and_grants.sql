-- path: migrations/10_efiles/04_rls_and_grants.sql
-- Description: Consolidated RLS policies and Grants for the E-Files module.

-- =================================================================
-- Section 1: Enable RLS & Define Table-Level Grants
-- =================================================================

-- Enable RLS on both module tables
ALTER TABLE public.e_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_movements ENABLE ROW LEVEL SECURITY;

-- Grant full permissions on module tables to all authenticated users.
-- This allows any logged-in user to act as an operator of the system.
GRANT ALL ON TABLE public.e_files TO authenticated;
GRANT ALL ON TABLE public.file_movements TO authenticated;

-- Grant SELECT on related views to all authenticated users.
GRANT SELECT ON TABLE public.v_e_files_extended TO authenticated;
GRANT SELECT ON TABLE public.v_file_movements_extended TO authenticated;

-- [CRITICAL] Grant SELECT on underlying tables used in the views.
GRANT SELECT ON TABLE 
    public.employees,
    public.employee_designations,
    public.maintenance_areas,
    public.user_profiles
TO authenticated;

-- Grant EXECUTE on all module functions to any authenticated user.
GRANT EXECUTE ON FUNCTION public.initiate_e_file(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.forward_e_file(UUID, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.close_e_file(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_e_file_details(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_e_file_record(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_initiate_e_files(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_efile_system_backup() TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_efile_system_backup(JSONB, JSONB) TO authenticated;


-- =================================================================
-- Section 2: RLS Policies
-- The security model is that any authenticated user is an "operator"
-- and can manage any file on behalf of the employees.
-- =================================================================

-- Drop old policies for idempotency
DROP POLICY IF EXISTS "Allow full access to authenticated users on e_files" ON public.e_files;
DROP POLICY IF EXISTS "Allow full access to authenticated users on file_movements" ON public.file_movements;

-- Policy for e_files: Allow any authenticated user full control.
CREATE POLICY "Allow full access to authenticated users on e_files"
ON public.e_files
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy for file_movements: Allow any authenticated user full control.
CREATE POLICY "Allow full access to authenticated users on file_movements"
ON public.file_movements
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);