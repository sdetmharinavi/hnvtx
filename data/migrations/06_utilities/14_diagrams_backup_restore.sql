-- path: data/migrations/06_utilities/15_diagrams_backup_restore.sql
-- Description: Functions for full Diagrams System Backup & Restore (Folders + Files).

-- 1. EXPORT FUNCTION
CREATE OR REPLACE FUNCTION public.get_diagrams_backup()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_folders JSONB;
    v_files JSONB;
    v_user_id UUID := auth.uid();
    v_is_admin BOOLEAN;
BEGIN
    -- Check permissions
    v_is_admin := public.is_super_admin() OR public.get_my_role() IN ('admin', 'admin_pro');

    -- Fetch Folders
    SELECT jsonb_agg(f) INTO v_folders FROM (
        SELECT 
            fo.id,
            fo.name,
            fo.created_at,
            u.email as owner_email -- Useful for admin backups
        FROM public.folders fo
        LEFT JOIN auth.users u ON fo.user_id = u.id
        WHERE v_is_admin OR fo.user_id = v_user_id
        ORDER BY fo.name
    ) f;

    -- Fetch Files
    SELECT jsonb_agg(fi) INTO v_files FROM (
        SELECT 
            f.id,
            f.file_name,
            f.file_type,
            f.file_size,
            f.file_route,
            f.file_url,
            f.uploaded_at,
            fo.name as folder_name, -- Link by name for portability
            fo.id as folder_id      -- Link by ID for precision
        FROM public.files f
        LEFT JOIN public.folders fo ON f.folder_id = fo.id
        WHERE v_is_admin OR f.user_id = v_user_id
        ORDER BY f.uploaded_at DESC
    ) fi;

    RETURN jsonb_build_object(
        'folders', COALESCE(v_folders, '[]'::jsonb),
        'files', COALESCE(v_files, '[]'::jsonb)
    );
END;
$$;

-- 2. IMPORT/RESTORE FUNCTION
CREATE OR REPLACE FUNCTION public.restore_diagrams_backup(
    p_folders JSONB, -- Array of folder objects
    p_files JSONB    -- Array of file objects
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    folder_item JSONB;
    file_item JSONB;
    
    v_folder_id UUID;
    v_user_id UUID := auth.uid();
    
    v_folders_processed INT := 0;
    v_files_processed INT := 0;
    v_errors JSONB := '[]'::JSONB;
BEGIN
    -- A. Process Folders
    FOR folder_item IN SELECT * FROM jsonb_array_elements(p_folders)
    LOOP
        BEGIN
            INSERT INTO public.folders (
                id,
                name,
                user_id,
                created_at
            ) VALUES (
                COALESCE((folder_item->>'id')::UUID, gen_random_uuid()), -- Use existing ID if present
                folder_item->>'name',
                v_user_id, -- Always assign to current user for safety (unless we add admin logic later)
                COALESCE((folder_item->>'created_at')::timestamptz, NOW())
            )
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                created_at = EXCLUDED.created_at;
                
            v_folders_processed := v_folders_processed + 1;
        EXCEPTION WHEN OTHERS THEN
             v_errors := v_errors || jsonb_build_object('type', 'folder', 'name', folder_item->>'name', 'error', SQLERRM);
        END;
    END LOOP;

    -- B. Process Files
    FOR file_item IN SELECT * FROM jsonb_array_elements(p_files)
    LOOP
        BEGIN
            -- 1. Resolve Folder ID
            -- Try exact ID match first
            v_folder_id := (file_item->>'folder_id')::UUID;
            
            -- If that folder doesn't exist (maybe new ID generated), try finding by name
            IF NOT EXISTS (SELECT 1 FROM public.folders WHERE id = v_folder_id) THEN
                SELECT id INTO v_folder_id 
                FROM public.folders 
                WHERE name = (file_item->>'folder_name') 
                  AND user_id = v_user_id 
                LIMIT 1;
            END IF;

            -- If still no folder, we skip or create a "Restored" folder? Skipping for now.
            IF v_folder_id IS NULL THEN 
                -- Optional: Create a default folder?
                CONTINUE; 
            END IF;

            INSERT INTO public.files (
                id,
                folder_id,
                user_id,
                file_name,
                file_type,
                file_size,
                file_route,
                file_url,
                uploaded_at
            ) VALUES (
                COALESCE((file_item->>'id')::UUID, gen_random_uuid()),
                v_folder_id,
                v_user_id,
                file_item->>'file_name',
                file_item->>'file_type',
                file_item->>'file_size',
                COALESCE(file_item->>'file_route', 'restored'),
                file_item->>'file_url',
                COALESCE((file_item->>'uploaded_at')::timestamptz, NOW())
            )
            ON CONFLICT (id) DO UPDATE SET
                file_name = EXCLUDED.file_name,
                folder_id = EXCLUDED.folder_id,
                file_url = EXCLUDED.file_url;

            v_files_processed := v_files_processed + 1;

        EXCEPTION WHEN OTHERS THEN
             v_errors := v_errors || jsonb_build_object('type', 'file', 'name', file_item->>'file_name', 'error', SQLERRM);
        END;
    END LOOP;

    RETURN jsonb_build_object(
        'folders_processed', v_folders_processed,
        'files_processed', v_files_processed,
        'errors', v_errors
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_diagrams_backup() TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_diagrams_backup(JSONB, JSONB) TO authenticated;