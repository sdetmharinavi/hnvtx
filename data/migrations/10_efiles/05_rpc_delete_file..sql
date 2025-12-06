-- path: data/migrations/10_efiles/05_enable_delete.sql
-- Description: Adds missing RLS policies to allow deletion of E-Files.

-- 1. Grant Table-Level DELETE permissions
-- Without this, RLS policies for DELETE are ignored.
GRANT ALL ON public.e_files TO authenticated;
GRANT ALL ON public.file_movements TO authenticated;

-- 2. Re-apply RLS Policies (Just to be 100% sure they exist)
DROP POLICY IF EXISTS "Authenticated users can delete e_files" ON public.e_files;
CREATE POLICY "Authenticated users can delete e_files"
ON public.e_files
FOR DELETE
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete movements" ON public.file_movements;
CREATE POLICY "Authenticated users can delete movements"
ON public.file_movements
FOR DELETE
TO authenticated
USING (true);

-- path: data/migrations/10_efiles/07_rpc_delete_file.sql
-- Description: Creates a secure RPC function to handle file deletion. 
-- This bypasses client-side permission issues by running as a privileged function.

CREATE OR REPLACE FUNCTION public.delete_e_file_record(
    p_file_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with the privileges of the creator (superuser/admin)
SET search_path = public
AS $$
DECLARE
    v_role TEXT;
BEGIN
    -- 1. Security Check: Only allow if user is logged in
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 2. Optional: Add logic here if you want to restrict WHO can delete
    -- e.g. IF NOT is_super_admin() ...

    -- 3. Perform the delete
    -- Because this function is SECURITY DEFINER, it bypasses RLS and Table Grants
    -- on the e_files table for the current user.
    DELETE FROM public.e_files WHERE id = p_file_id;
    
    -- Raise an error if nothing was deleted (id didn't exist)
    IF NOT FOUND THEN
        RAISE EXCEPTION 'File not found or already deleted';
    END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_e_file_record(UUID) TO authenticated;