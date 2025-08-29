import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { Database } from "@/types/supabase-types";

type FileRecord = Database["public"]["Tables"]["files"]["Row"];
type FileInsert = Database["public"]["Tables"]["files"]["Insert"];
type FileUpdate = Database["public"]["Tables"]["files"]["Update"];

export function useFiles(folderId?: string | null) {
  const supabase = createClient();
  
  return useQuery({
    queryKey: ["files", folderId],
    queryFn: async () => {
      let query = supabase
        .from("files")
        .select("*");
      
      if (folderId) {
        query = query.eq("folder_id", folderId);
      }
      
      const { data, error } = await query.order("uploaded_at", { ascending: false });
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data || [];
    },
    enabled: true,
  });
}

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
        
      if (error) {
        throw new Error(error.message);
      }
      
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["files", variables.folder_id] 
      });
    },
  });
}

export function useDeleteFile() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      id,
      folderId,
    }: {
      id: string;
      folderId?: string | null;
    }) => {
      const { error } = await supabase
        .from("files")
        .delete()
        .eq("id", id);
        
      if (error) {
        throw new Error(error.message);
      }
      
      return { id };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["files", variables.folderId] 
      });
    },
  });
}

export function useUpdateFile() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: FileUpdate;
    }) => {
      const { data, error } = await supabase
        .from("files")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
        
      if (error) {
        throw new Error(error.message);
      }
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ["files", data.folder_id] 
      });
    },
  });
}
