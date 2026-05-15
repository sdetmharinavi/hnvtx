// hooks/database/file-queries.ts
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { Database } from '@/types/supabase-types';
import { useCallback } from 'react';
import { toast } from 'sonner';
import { FilesRowSchema, FoldersRowSchema } from '@/schemas/zod-schemas';

type FileInsert = Database['public']['Tables']['files']['Insert'];
type FileUpdate = Database['public']['Tables']['files']['Update'];

export function useFiles(folderId?: string | null) {
  const supabase = createClient();

  const queryFn = useCallback(async (): Promise<FilesRowSchema[]> => {
    let query = supabase.from('files').select('*');
    if (folderId) {
      query = query.eq('folder_id', folderId);
    }
    const { data, error } = await query.order('uploaded_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }, [folderId, supabase]);

  return useQuery({
    queryKey: ['files', folderId],
    queryFn,
    enabled: true,
  });
}

export function useFoldersList() {
  const supabase = createClient();

  const queryFn = useCallback(async (): Promise<FoldersRowSchema[]> => {
    const { data, error } = await supabase.from('folders').select('*').order('name');
    if (error) throw new Error(error.message);
    return data || [];
  }, [supabase]);

  return useQuery({
    queryKey: ['folders'],
    queryFn,
  });
}

// --- MUTATIONS (Online Only) ---

export function useUploadFile() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fileData: FileInsert) => {
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

  return useMutation({
    mutationFn: async ({ id, folderId }: { id: string; folderId?: string | null }) => {
      const { error } = await supabase.from('files').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return { id, folderId };
    },
    onSuccess: (data) => {
      toast.success('File deleted');
      queryClient.invalidateQueries({ queryKey: ['files', data.folderId] });
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useUpdateFile() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: FileUpdate }) => {
      const { data, error } = await supabase
        .from('files')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      toast.success('File updated');
      queryClient.invalidateQueries({ queryKey: ['files', data.folder_id] });
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useDeleteFolder() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (folderId: string) => {
      // First, check if folder is empty on the server
      const { count, error: countError } = await supabase
        .from('files')
        .select('*', { count: 'exact', head: true })
        .eq('folder_id', folderId);
      if (countError) throw new Error(`Could not verify folder contents: ${countError.message}`);
      if (count !== 0) throw new Error('Cannot delete folder: It is not empty.');
      
      // If empty, proceed with deletion
      const { error } = await supabase.from('folders').delete().eq('id', folderId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success('Folder deleted');
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
    onError: (err) => toast.error(err.message),
  });
}