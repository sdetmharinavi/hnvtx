// hooks/database/file-queries.ts
import { useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { localDb } from '@/hooks/data/localDb';
import { useLocalFirstQuery } from '@/hooks/data/useLocalFirstQuery';
import { FilesRowSchema, FoldersRowSchema } from '@/schemas/zod-schemas';

export function useFiles(folderId?: string | null) {
  const supabase = createClient();

  const onlineQueryFn = useCallback(async (): Promise<FilesRowSchema[]> => {
    let query = supabase.from('files').select('*');
    if (folderId) {
      query = query.eq('folder_id', folderId);
    }
    const { data, error } = await query.order('uploaded_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data ||[];
  }, [folderId, supabase]);

  const localQueryFn = useCallback(() => {
    if (!folderId) {
      return localDb.files.toArray();
    }
    return localDb.files.where('folder_id').equals(folderId).reverse().sortBy('uploaded_at');
  },[folderId]);

  const { data, isLoading, error, refetch } = useLocalFirstQuery<'files'>({
    queryKey: ['files', folderId],
    onlineQueryFn,
    localQueryFn,
    dexieTable: localDb.files,
    enabled: true,
    localQueryDeps: [folderId],
  });

  return { data: data ||[], isLoading, error, refetch };
}

export function useFoldersList() {
  const supabase = createClient();

  const onlineQueryFn = useCallback(async (): Promise<FoldersRowSchema[]> => {
    const { data, error } = await supabase.from('folders').select('*').order('name');
    if (error) throw new Error(error.message);
    return data || [];
  }, [supabase]);

  const localQueryFn = useCallback(() => {
    return localDb.folders.orderBy('name').toArray();
  },[]);

  const { data, isLoading, refetch } = useLocalFirstQuery<'folders'>({
    queryKey: ['folders'],
    onlineQueryFn,
    localQueryFn,
    dexieTable: localDb.folders,
  });

  return { folders: data ||[], isLoading, refetch };
}