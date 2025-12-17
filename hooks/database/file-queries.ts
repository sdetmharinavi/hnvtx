// hooks/database/file-queries.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { Database } from "@/types/supabase-types";
import { useCallback } from "react";
import { localDb } from "@/hooks/data/localDb";
import { useLocalFirstQuery } from "@/hooks/data/useLocalFirstQuery";
import { FilesRowSchema, FoldersRowSchema } from "@/schemas/zod-schemas";
import { useOnlineStatus } from "@/hooks/useOnlineStatus"; // ADDED
import { toast } from "sonner";

type FileInsert = Database["public"]["Tables"]["files"]["Insert"];
type FileUpdate = Database["public"]["Tables"]["files"]["Update"];

export function useFiles(folderId?: string | null) {
  const supabase = createClient();
  
  const onlineQueryFn = useCallback(async (): Promise<FilesRowSchema[]> => {
    let query = supabase.from("files").select("*");
    if (folderId) {
      query = query.eq("folder_id", folderId);
    }
    const { data, error } = await query.order("uploaded_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }, [folderId, supabase]);

  const localQueryFn = useCallback(() => {
    if (!folderId) {
       return localDb.files.toArray(); 
    }
    return localDb.files
      .where("folder_id")
      .equals(folderId)
      .reverse() 
      .sortBy("uploaded_at");
  }, [folderId]);

  const { data, isLoading, error, refetch } = useLocalFirstQuery<'files'>({
    queryKey: ["files", folderId],
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
    const { data, error } = await supabase.from("folders").select("*").order("name");
    if (error) throw new Error(error.message);
    return data || [];
  }, [supabase]);

  const localQueryFn = useCallback(() => {
    return localDb.folders.orderBy("name").toArray();
  }, []);

  const { data, isLoading, refetch } = useLocalFirstQuery<'folders'>({
    queryKey: ["folders"],
    onlineQueryFn,
    localQueryFn,
    dexieTable: localDb.folders,
  });

  return { folders: data || [], isLoading, refetch };
}

// --- MUTATIONS ---

export function useUploadFile() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (fileData: FileInsert) => {
      // Note: File uploading usually goes through Uppy, which calls /api/upload.
      // This hook is for manual meta-data inserts if needed.
      const { data, error } = await supabase
        .from("files")
        .insert(fileData)
        .select()
        .single();
        
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["files", variables.folder_id] });
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });
}

export function useDeleteFile() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus(); // ADDED

  return useMutation({
    mutationFn: async ({ id }: { id: string; folderId?: string | null }) => {
      if (!isOnline) throw new Error("Deleting files requires an online connection.");
      
      const { error } = await supabase.from("files").delete().eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    },
    onSuccess: (_, variables) => {
      toast.success("File deleted");
      queryClient.invalidateQueries({ queryKey: ["files", variables.folderId] });
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
    onError: (err) => toast.error(err.message)
  });
}

export function useUpdateFile() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus(); // ADDED
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: FileUpdate }) => {
      if (!isOnline) throw new Error("Updating file metadata requires an online connection.");

      const { data, error } = await supabase
        .from("files")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
        
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      toast.success("File updated");
      queryClient.invalidateQueries({ queryKey: ["files", data.folder_id] });
    },
    onError: (err) => toast.error(err.message)
  });
}

export function useDeleteFolder() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus(); // ADDED

  return useMutation({
    mutationFn: async (folderId: string) => {
      if (!isOnline) throw new Error("Deleting folders requires an online connection.");

      const { error } = await supabase.from("folders").delete().eq("id", folderId);
      if (error) {
        if (error.code === '23503') {
          throw new Error("Cannot delete folder: It contains files.");
        }
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast.success("Folder deleted");
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
    onError: (err) => toast.error(err.message)
  });
}