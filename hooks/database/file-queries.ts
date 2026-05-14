// hooks/database/file-queries.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { Database } from '@/types/supabase-types';
import { useCallback } from 'react';
import { localDb } from '@/hooks/data/localDb';
import { useLocalFirstQuery } from '@/hooks/data/useLocalFirstQuery';
import { FilesRowSchema, FoldersRowSchema } from '@/schemas/zod-schemas';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { toast } from 'sonner';
import { addMutationToQueue } from '@/hooks/data/useMutationQueue';
import { FiWifiOff } from 'react-icons/fi';
import React from 'react';

type FileInsert = Database['public']['Tables']['files']['Insert'];
type FileUpdate = Database['public']['Tables']['files']['Update'];

export function useFiles(folderId?: string | null) {
  const supabase = createClient();

  const onlineQueryFn = useCallback(async (): Promise<FilesRowSchema[]> => {
    let query = supabase.from('files').select('*');
    if (folderId) {
      query = query.eq('folder_id', folderId);
    }
    const { data, error } = await query.order('uploaded_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }, [folderId, supabase]);

  const localQueryFn = useCallback(() => {
    if (!folderId) {
      return localDb.files.toArray();
    }
    return localDb.files.where('folder_id').equals(folderId).reverse().sortBy('uploaded_at');
  }, [folderId]);

  const { data, isLoading, error, refetch } = useLocalFirstQuery<'files'>({
    queryKey: ['files', folderId],
    onlineQueryFn,
    localQueryFn,
    dexieTable: localDb.files,
    enabled: true,
    localQueryDeps: [folderId],
  });

  return { data: data || [], isLoading, error, refetch };
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
  }, []);

  const { data, isLoading, refetch } = useLocalFirstQuery<'folders'>({
    queryKey: ['folders'],
    onlineQueryFn,
    localQueryFn,
    dexieTable: localDb.folders,
  });

  return { folders: data || [], isLoading, refetch };
}

// --- MUTATIONS (Offline Enabled) ---

export function useUploadFile() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  // Uploading binaries strictly requires network
  const isOnline = useOnlineStatus();

  return useMutation({
    mutationFn: async (fileData: FileInsert) => {
      if (!isOnline) throw new Error('Uploading files requires an online connection.');

      const { data, error } = await supabase.from('files').insert(fileData).select().single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['files', variables.folder_id] });
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });
}

export function useDeleteFile() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();

  return useMutation({
    mutationFn: async ({ id, folderId }: { id: string; folderId?: string | null }) => {
      // 1. Optimistic / Offline Logic
      if (!isOnline) {
        await localDb.files.delete(id);
        await addMutationToQueue({
          tableName: 'files',
          type: 'delete',
          payload: { ids: [id] },
        });
        return { id, folderId, offline: true };
      }

      // 2. Online Logic
      const { error } = await supabase.from('files').delete().eq('id', id);
      if (error) throw new Error(error.message);

      // Also clean local DB to be sure
      await localDb.files.delete(id);

      return { id, folderId, offline: false };
    },
    onSuccess: (data) => {
      if (data.offline) {
        toast.warning('File deleted locally. Sync pending.', {
          icon: React.createElement(FiWifiOff),
        });
      } else {
        toast.success('File deleted');
      }
      queryClient.invalidateQueries({ queryKey: ['files', data.folderId] });
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useUpdateFile() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: FileUpdate }) => {
      if (!isOnline) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await localDb.files.update(id, updates as any);
        await addMutationToQueue({
          tableName: 'files',
          type: 'update',
          payload: { id, data: updates },
        });
        return { id, ...updates, offline: true };
      }

      const { data, error } = await supabase
        .from('files')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);

      // Update local db
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await localDb.files.put(data as any);

      return { ...data, offline: false };
    },
    onSuccess: (data) => {
      if (data.offline) {
        toast.warning('File updated locally. Sync pending.', {
          icon: React.createElement(FiWifiOff),
        });
      } else {
        toast.success('File updated');
      }
      queryClient.invalidateQueries({ queryKey: ['files', data.folder_id] });
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useDeleteFolder() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();

  return useMutation({
    mutationFn: async (folderId: string) => {
      // Check if folder is empty (Local Check)
      const filesInFolder = await localDb.files.where('folder_id').equals(folderId).count();
      if (filesInFolder > 0) {
        throw new Error('Cannot delete folder: It contains files. Please empty it first.');
      }

      if (!isOnline) {
        await localDb.folders.delete(folderId);
        await addMutationToQueue({
          tableName: 'folders',
          type: 'delete',
          payload: { ids: [folderId] },
        });
        return { offline: true };
      }

      const { error } = await supabase.from('folders').delete().eq('id', folderId);
      if (error) {
        if (error.code === '23503') {
          throw new Error('Cannot delete folder: It contains files.');
        }
        throw new Error(error.message);
      }

      await localDb.folders.delete(folderId);
      return { offline: false };
    },
    onSuccess: (data) => {
      if (data.offline) {
        toast.warning('Folder deleted locally. Sync pending.', {
          icon: React.createElement(FiWifiOff),
        });
      } else {
        toast.success('Folder deleted');
      }
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
    onError: (err) => toast.error(err.message),
  });
}
