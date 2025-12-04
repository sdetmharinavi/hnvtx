BEGIN;

-- 1. Grant access to the specific E-File tables
GRANT SELECT, INSERT, UPDATE ON public.e_files TO authenticated;
GRANT SELECT, INSERT ON public.file_movements TO authenticated;

-- 2. Grant access to the Views
GRANT SELECT ON public.v_e_files_extended TO authenticated;
GRANT SELECT ON public.v_file_movements_extended TO authenticated;

-- 3. CRITICAL: Grant access to the underlying tables used in the JOINs
-- Without these, the "security_invoker" view will fail with 42501.
GRANT SELECT ON public.employees TO authenticated;
GRANT SELECT ON public.employee_designations TO authenticated;
GRANT SELECT ON public.maintenance_areas TO authenticated;
GRANT SELECT ON public.user_profiles TO authenticated;

COMMIT;