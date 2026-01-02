// hooks/data/useEFilesData.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { 
  InitiateFilePayload, 
  ForwardFilePayload,
  v_e_files_extendedRowSchema,
  v_file_movements_extendedRowSchema,
  UpdateMovementPayload
} from "@/schemas/efile-schemas";
import { z } from "zod";
import { useLocalFirstQuery } from "@/hooks/data/useLocalFirstQuery";
import { localDb } from "@/hooks/data/localDb";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { V_e_files_extendedRowSchema, V_file_movements_extendedRowSchema } from "@/schemas/zod-schemas";

const supabase = createClient();

export interface UpdateFilePayload {
  file_id: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
}

// --- HELPER: SYNC SINGLE FILE TO LOCAL DB ---
const syncFileToLocal = async (fileId: string) => {
  try {
    const { data: fileData, error: fileError } = await supabase.rpc('get_paged_data', {
      p_view_name: 'v_e_files_extended',
      p_limit: 1,
      p_offset: 0,
      p_filters: { id: fileId }
    });

    if (fileError) throw fileError;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fileRecord = (fileData as any)?.data?.[0] as V_e_files_extendedRowSchema;

    const { data: movesData, error: movesError } = await supabase.rpc('get_paged_data', {
      p_view_name: 'v_file_movements_extended',
      p_limit: 100,
      p_offset: 0,
      p_filters: { file_id: fileId }
    });

    if (movesError) throw movesError;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const movementRecords = (movesData as any)?.data as V_file_movements_extendedRowSchema[];

    await localDb.transaction('rw', localDb.v_e_files_extended, localDb.v_file_movements_extended, async () => {
      if (fileRecord) {
        await localDb.v_e_files_extended.put(fileRecord);
      }
      if (movementRecords && movementRecords.length > 0) {
        await localDb.v_file_movements_extended.bulkPut(movementRecords);
      }
    });

  } catch (err) {
    console.error("Failed to sync file to local DB:", err);
  }
};


// List Hook
export function useEFiles(filters?: { status?: string; }) {
  
  const onlineQueryFn = async () => {
    const rpcFilters: Record<string, unknown> = {};
    if (filters?.status && filters.status !== '') rpcFilters.status = filters.status;

    const { data, error } = await supabase.rpc('get_paged_data', {
      p_view_name: 'v_e_files_extended',
      p_limit: 2000, 
      p_offset: 0,
      p_filters: rpcFilters,
      p_order_by: 'updated_at',
      p_order_dir: 'desc'
    });

    if (error) throw error;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = (data as any)?.data || [];
    
    const safeParse = z.array(v_e_files_extendedRowSchema).safeParse(rows);
    if (!safeParse.success) {
        console.error("E-File schema mismatch", safeParse.error);
        return rows as z.infer<typeof v_e_files_extendedRowSchema>[];
    }
    return safeParse.data;
  };

  const localQueryFn = () => {
    let collection = localDb.v_e_files_extended.toCollection();
    
    if (filters?.status && filters.status !== '') {
      collection = localDb.v_e_files_extended
        .where('status')
        .equals(filters.status);
    }

    return collection
      .reverse() 
      .sortBy('updated_at'); 
  };

  const { data, isLoading, error, refetch, isFetching } = useLocalFirstQuery<'v_e_files_extended'>({
    queryKey: ['e-files', filters],
    onlineQueryFn,
    localQueryFn,
    dexieTable: localDb.v_e_files_extended,
    localQueryDeps: [filters?.status]
  });

  return { data: data || [], isLoading, error, refetch, isFetching };
}

// Details Hook
export function useEFileDetails(fileId: string) {
  
  const onlineQueryFn = async () => {
      const { data: fileResult, error: fileError } = await supabase.rpc('get_paged_data', {
        p_view_name: 'v_e_files_extended',
        p_filters: { id: fileId },
        p_limit: 1,
        p_offset: 0
      });

      if (fileError) throw fileError;

      const { data: historyResult, error: historyError } = await supabase.rpc('get_paged_data', {
        p_view_name: 'v_file_movements_extended',
        p_filters: { file_id: fileId },
        p_limit: 100,
        p_offset: 0,
        // Sort by action_date instead of created_at
        p_order_by: 'action_date',
        p_order_dir: 'desc'
      });

      if (historyError) throw historyError;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fileRow = (fileResult as any)?.data?.[0];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const historyRows = (historyResult as any)?.data || [];

      if (!fileRow) throw new Error("File not found");

      return {
        file: v_e_files_extendedRowSchema.parse(fileRow),
        history: z.array(v_file_movements_extendedRowSchema).parse(historyRows)
      };
  };
  
  return useQuery({
    queryKey: ['e-file-details', fileId],
    queryFn: async () => {
       // 1. Try Local First
       const localFile = await localDb.v_e_files_extended.get(fileId);
       
       if (localFile) {
          // Sort local history by action_date if available
          const localHistory = await localDb.v_file_movements_extended
             .where('file_id').equals(fileId)
             .toArray();
             
          localHistory.sort((a, b) => {
              const dateA = new Date(a.action_date || a.created_at || 0).getTime();
              const dateB = new Date(b.action_date || b.created_at || 0).getTime();
              return dateB - dateA; // Descending
          });
          
          return {
             file: localFile,
             history: localHistory as z.infer<typeof v_file_movements_extendedRowSchema>[]
          };
       }

       // 2. If no local data, force online
       return onlineQueryFn();
    },
    refetchOnMount: true, 
    staleTime: 5 * 60 * 1000 
  });
}

// --- MUTATIONS ---

export function useInitiateFile() {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();

  return useMutation({
    mutationFn: async (payload: InitiateFilePayload) => {
      if (!isOnline) throw new Error("Initiating files requires an online connection.");

      const { data, error } = await supabase.rpc('initiate_e_file', {
        p_file_number: payload.file_number,
        p_subject: payload.subject,
        p_description: payload.description || '',
        p_category: payload.category,
        p_priority: payload.priority,
        p_remarks: payload.remarks || 'File initiated',
        p_initiator_employee_id: payload.initiator_employee_id,
        // Added action_date
        p_action_date: payload.action_date || new Date().toISOString()
      });
      if (error) throw error;
      return data; 
    },
    onSuccess: async (newFileId) => {
      toast.success("E-File initiated successfully!");
      if (newFileId) {
          await syncFileToLocal(newFileId);
      }
      queryClient.invalidateQueries({ queryKey: ['e-files'] });
    },
    onError: (err) => toast.error(`Failed: ${err.message}`)
  });
}

export function useUpdateFileDetails() {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();

  return useMutation({
    mutationFn: async (payload: UpdateFilePayload) => {
      if (!isOnline) throw new Error("Updating files requires an online connection.");

      const { error } = await supabase.rpc('update_e_file_details', {
        p_file_id: payload.file_id,
        p_subject: payload.subject,
        p_description: payload.description,
        p_category: payload.category,
        p_priority: payload.priority,
      });
      if (error) throw error;
    },
    onSuccess: async (_, vars) => {
      toast.success("File details updated!");
      await syncFileToLocal(vars.file_id);
      
      queryClient.invalidateQueries({ queryKey: ['e-files'] });
      queryClient.invalidateQueries({ queryKey: ['e-file-details', vars.file_id] });
    },
    onError: (err) => toast.error(`Update failed: ${err.message}`)
  });
}

export function useForwardFile() {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  
  return useMutation({
    mutationFn: async (payload: ForwardFilePayload) => {
      if (!isOnline) throw new Error("Forwarding files requires an online connection.");

      const { error } = await supabase.rpc('forward_e_file', {
        p_file_id: payload.file_id,
        p_to_employee_id: payload.to_employee_id,
        p_remarks: payload.remarks,
        p_action_type: payload.action_type,
        // Added action_date
        p_action_date: payload.action_date || new Date().toISOString()
      });
      if (error) throw error;
    },
    onSuccess: async (_, vars) => {
      toast.success(`File ${vars.action_type} successfully!`);
      await syncFileToLocal(vars.file_id);
      
      queryClient.invalidateQueries({ queryKey: ['e-files'] });
      queryClient.invalidateQueries({ queryKey: ['e-file-details', vars.file_id] });
    },
    onError: (err) => toast.error(`Failed: ${err.message}`)
  });
}

// NEW: Update Movement Hook
export function useUpdateMovement() {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();

  return useMutation({
    mutationFn: async (payload: UpdateMovementPayload & { fileId: string }) => {
      if (!isOnline) throw new Error("Editing movements requires an online connection.");

      const { error } = await supabase.rpc('update_file_movement', {
        p_movement_id: payload.movement_id,
        p_remarks: payload.remarks,
        p_action_date: payload.action_date
      });
      if (error) throw error;
    },
    onSuccess: async (_, vars) => {
      toast.success("Movement updated successfully!");
      // We sync the whole file to refresh the timeline
      await syncFileToLocal(vars.fileId);
      queryClient.invalidateQueries({ queryKey: ['e-file-details', vars.fileId] });
    },
    onError: (err) => toast.error(`Update failed: ${err.message}`)
  });
}

export function useCloseFile() {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();

  return useMutation({
    mutationFn: async ({ fileId, remarks }: { fileId: string; remarks: string }) => {
      if (!isOnline) throw new Error("Closing files requires an online connection.");

      const { error } = await supabase.rpc('close_e_file', {
        p_file_id: fileId,
        p_remarks: remarks
      });
      if (error) throw error;
    },
    onSuccess: async (_, vars) => {
      toast.success("File closed successfully!");
      await syncFileToLocal(vars.fileId);

      queryClient.invalidateQueries({ queryKey: ['e-files'] });
      queryClient.invalidateQueries({ queryKey: ['e-file-details', vars.fileId] });
    },
    onError: (err) => toast.error(`Failed: ${err.message}`)
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();

  return useMutation({
    mutationFn: async (fileId: string) => {
      if (!isOnline) throw new Error("Deleting files requires an online connection.");

      const { error } = await supabase.rpc('delete_e_file_record', { p_file_id: fileId });
      if (error) throw error;
    },
    onSuccess: async (_, fileId) => {
      toast.success("File deleted successfully!");
      await localDb.v_e_files_extended.delete(fileId);
      await localDb.v_file_movements_extended.where('file_id').equals(fileId).delete();
      
      queryClient.invalidateQueries({ queryKey: ['e-files'] });
    },
    onError: (err) => toast.error(`Failed to delete file: ${err.message}`)
  });
}