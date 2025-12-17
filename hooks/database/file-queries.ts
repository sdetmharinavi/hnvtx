// hooks/database/file-queries.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { Database } from "@/types/supabase-types";
import { useCallback } from "react";
import { localDb } from "@/hooks/data/localDb";
import { useLocalFirstQuery } from "@/hooks/data/useLocalFirstQuery";
import { FilesRowSchema, FoldersRowSchema } from "@/schemas/zod-schemas";

type FileInsert = Database["public"]["Tables"]["files"]["Insert"];
type FileUpdate = Database["public"]["Tables"]["files"]["Update"];

// --- 1. REFACTORED: useFiles now uses useLocalFirstQuery ---
export function useFiles(folderId?: string | null) {
  const supabase = createClient();
  
  // Online fetcher using RPC for consistency, or direct select if simple
  const onlineQueryFn = useCallback(async (): Promise<FilesRowSchema[]> => {
    let query = supabase.from("files").select("*");
    if (folderId) {
      query = query.eq("folder_id", folderId);
    }
    const { data, error } = await query.order("uploaded_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }, [folderId, supabase]);

  // Offline fetcher using Dexie
  const localQueryFn = useCallback(() => {
    if (!folderId) {
       // Return all files? Or empty? Usually files are viewed per folder.
       // Let's return empty if no folder selected to avoid massive lists.
       // Or if 'undefined' means root?
       // For now, if folderId is undefined, we probably want nothing or root files.
       return localDb.files.toArray(); 
    }
    return localDb.files
      .where("folder_id")
      .equals(folderId)
      .reverse() // Approximate sort
      .sortBy("uploaded_at");
  }, [folderId]);

  const { data, isLoading, error, refetch } = useLocalFirstQuery<'files'>({
    queryKey: ["files", folderId],
    onlineQueryFn,
    localQueryFn,
    dexieTable: localDb.files,
    enabled: true, // Always enabled so local data shows
    localQueryDeps: [folderId],
  });

  return { data: data || [], isLoading, error, refetch };
}

// --- 2. REFACTORED: useFolders uses useLocalFirstQuery for consistency too ---
// (Optional, but good for uniformity)
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

// ... Mutations remain largely the same, but invalidate properly ...

export function useUploadFile() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (fileData: FileInsert) => {
      const { data, error } = await supabase
        .from("files")
        .insert(fileData)
        .select()
        .single();
        
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidate both the specific folder list and the general files cache
      queryClient.invalidateQueries({ queryKey: ["files", variables.folder_id] });
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });
}

export function useDeleteFile() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id }: { id: string; folderId?: string | null }) => {
      const { error } = await supabase.from("files").delete().eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["files", variables.folderId] });
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });
}

export function useUpdateFile() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: FileUpdate }) => {
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
      queryClient.invalidateQueries({ queryKey: ["files", data.folder_id] });
    },
  });
}

export function useDeleteFolder() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (folderId: string) => {
      const { error } = await supabase.from("folders").delete().eq("id", folderId);
      if (error) {
        if (error.code === '23503') {
          throw new Error("Cannot delete folder: It contains files.");
        }
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    }
  });
}